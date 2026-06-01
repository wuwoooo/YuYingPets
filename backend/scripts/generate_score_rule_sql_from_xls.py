import argparse
import json
import re
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from xml.etree import ElementTree as ET

import xlrd


SPREADSHEET_NS = {"a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
LEGACY_SHEET_CONFIG = {
    "教务": {"module_type": "general", "subject_code": None, "sheet_code": "GENERAL"},
    "语文组": {"module_type": "subject", "subject_code": "chinese", "sheet_code": "CHINESE"},
    "数学组": {"module_type": "subject", "subject_code": "math", "sheet_code": "MATH"},
    "英语组": {"module_type": "subject", "subject_code": "english", "sheet_code": "ENGLISH"},
    "物理组": {"module_type": "subject", "subject_code": "physics", "sheet_code": "PHYSICS"},
    "化学组": {"module_type": "subject", "subject_code": "chemistry", "sheet_code": "CHEMISTRY"},
    "地理组": {"module_type": "subject", "subject_code": "geography", "sheet_code": "GEOGRAPHY"},
    "生物组": {"module_type": "subject", "subject_code": "biology", "sheet_code": "BIOLOGY"},
    "历史组": {"module_type": "subject", "subject_code": "history", "sheet_code": "HISTORY"},
    "政治组": {"module_type": "subject", "subject_code": "politics", "sheet_code": "POLITICS"},
    "音美信综合组": {"module_type": "subject", "subject_code": "arts_it", "sheet_code": "ARTS_IT"},
    "体育组": {"module_type": "subject", "subject_code": "pe", "sheet_code": "PE"},
}


@dataclass
class ParsedScore:
    score_type: str
    values: list[int]
    source_text: str


def normalize_score_text(raw) -> str:
    if isinstance(raw, float):
        if raw.is_integer():
            return str(int(raw))
        return str(raw)
    text = str(raw).strip()
    text = text.replace(" ", "")
    text = text.replace("＋", "+").replace("－", "-").replace("—", "-").replace("–", "-").replace("~", "-")
    text = text.replace("分", "")
    return text


def clean_source_row(sheet_name: str, rule_name: str, raw_score, description: str):
    cleaned_name = rule_name.strip().replace("\n", "").replace("\r", "")
    cleaned_description = description.strip()
    cleaned_score = raw_score

    if sheet_name == "教务" and cleaned_name == "学生工具单收纳混乱":
        cleaned_score = -2

    if sheet_name == "化学组" and cleaned_name == "化学周测退步" and "进步" in cleaned_description:
        cleaned_name = "化学周测进步"

    if sheet_name == "地理组" and cleaned_name == "回答问题有独立的生物思维":
        cleaned_name = "回答问题有独立的地理思维"

    if sheet_name == "生物组" and cleaned_name == "回答问题有独立的地理思维":
        cleaned_name = "回答问题有独立的生物思维"

    if cleaned_name == "不合格不该错":
        cleaned_name = "不合格不改错"

    return cleaned_name, cleaned_score, cleaned_description


def parse_score(raw) -> ParsedScore:
    text = normalize_score_text(raw)
    if not text:
        raise ValueError("empty score")

    if re.fullmatch(r"[+-]?\d+", text):
        value = int(text)
        return ParsedScore("add" if value >= 0 else "deduct", [abs(value)], text)

    for pattern, score_type in (
        (r"^\+?(\d+)-\+?(\d+)$", "add"),
        (r"^加(\d+)-(\d+)$", "add"),
        (r"^扣(\d+)-(\d+)$", "deduct"),
        (r"^-(\d+)-(\d+)$", "deduct"),
    ):
        match = re.fullmatch(pattern, text)
        if match:
            low, high = sorted((int(match.group(1)), int(match.group(2))))
            return ParsedScore(score_type, list(range(low, high + 1)), text)

    for pattern, score_type in (
        (r"^加(\d+)$", "add"),
        (r"^扣(\d+)$", "deduct"),
    ):
        match = re.fullmatch(pattern, text)
        if match:
            return ParsedScore(score_type, [int(match.group(1))], text)

    raise ValueError(f"unsupported score text: {text}")


def infer_scene_code(text: str) -> str:
    keyword_map = [
        ("迟到", "attendance"),
        ("早退", "attendance"),
        ("旷课", "attendance"),
        ("竞赛", "competition"),
        ("比赛", "competition"),
        ("早读", "reading"),
        ("背诵", "recitation"),
        ("背书", "recitation"),
        ("读单词", "reading"),
        ("读课本", "reading"),
        ("听默写", "dictation"),
        ("听写", "dictation"),
        ("默写", "dictation"),
        ("周测", "exam"),
        ("月评价", "exam"),
        ("期末", "exam"),
        ("考试", "exam"),
        ("测验", "exam"),
        ("作业", "homework"),
        ("改错", "homework"),
        ("课堂", "classroom"),
        ("上课", "classroom"),
        ("学风", "classroom"),
        ("自习", "self_study"),
        ("展讲", "presentation"),
        ("答疑", "qa"),
        ("问问题", "qa"),
        ("器材", "equipment"),
        ("设备", "equipment"),
        ("机房", "equipment"),
        ("画室", "equipment"),
        ("音乐厅", "equipment"),
        ("小组", "group"),
        ("合作", "group"),
        ("活动", "activity"),
        ("展示", "activity"),
        ("升旗", "activity"),
        ("早操", "activity"),
        ("课间操", "activity"),
        ("团队会", "activity"),
        ("文化", "activity"),
        ("宿舍", "behavior"),
        ("礼仪", "behavior"),
        ("卫生", "behavior"),
        ("整理", "behavior"),
        ("收纳", "behavior"),
        ("坐姿", "behavior"),
        ("纪律", "discipline"),
    ]
    for keyword, scene_code in keyword_map:
        if keyword in text:
            return scene_code
    return "classroom"


def infer_dimension_and_tag(text: str, sentiment: str) -> tuple[str, str]:
    mapping = [
        (("迟到", "早退", "旷课"), ("出勤管理", "时间纪律")),
        (("作业", "改错"), ("作业管理", "任务完成")),
        (("周测", "月评价", "考试", "测验", "考核"), ("学业成绩", "测评表现")),
        (("竞赛", "比赛", "活动", "展示", "作品"), ("学科活动", "活动参与")),
        (("早读", "背诵", "背书", "听默写", "听写", "默写"), ("背诵与早读", "语言积累")),
        (("纪律", "违纪", "打闹", "喧哗", "顶撞"), ("课堂纪律", "自我管理")),
        (("器材", "设备", "机房", "画室", "音乐厅"), ("场室与器材", "规范使用")),
        (("小组", "合作", "互助"), ("合作表现", "协作互助")),
        (("坐姿", "桌面", "收纳", "工具单"), ("行为规范", "习惯养成")),
        (("答疑", "问问题", "讲解", "回答问题"), ("课堂学习", "互动表达")),
        (("礼仪", "仪容", "红领巾"), ("文明礼仪", "形象规范")),
        (("卫生", "垃圾", "整洁"), ("劳动实践", "卫生维护")),
        (("班委", "委员", "总裁团"), ("班级建设", "岗位履责")),
        (("就餐", "光盘", "粮食"), ("文明礼仪", "用餐规范")),
    ]
    for keywords, result in mapping:
        if any(keyword in text for keyword in keywords):
            return result
    if sentiment == "negative":
        return ("课堂管理", "负向行为")
    return ("课堂学习", "综合表现")


def is_high_frequency(text: str) -> bool:
    keywords = (
        "课堂",
        "作业",
        "早读",
        "迟到",
        "违纪",
        "背诵",
        "听写",
        "默写",
        "周测",
        "收纳",
        "坐姿",
        "纪律",
        "仪容",
        "卫生",
        "就餐",
        "升旗",
        "早操",
        "课间操",
    )
    return any(keyword in text for keyword in keywords)


def should_display(text: str, score_value: int, score_type: str, score_target: str) -> bool:
    if score_target == "class":
        return False
    if any(keyword in text for keyword in ("作弊", "顶撞", "损坏", "伪造", "抄袭")):
        return False
    if score_type == "deduct" and score_value >= 5:
        return False
    return True


def sql_quote(value: str) -> str:
    return "'" + value.replace("\\", "\\\\").replace("'", "''") + "'"


def signed_label(score_type: str, score_value: int) -> str:
    return f"{'+' if score_type == 'add' else '-'}{score_value}分"


def iter_xlsx_rows(workbook_path: Path) -> Iterable[tuple[str, list[list[str]]]]:
    with zipfile.ZipFile(workbook_path) as archive:
        shared_strings: list[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for item in root.findall("a:si", SPREADSHEET_NS):
                shared_strings.append("".join(node.text or "" for node in item.iterfind(".//a:t", SPREADSHEET_NS)))

        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        relations = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        relation_map = {item.attrib["Id"]: item.attrib["Target"] for item in relations}

        for sheet in workbook.find("a:sheets", SPREADSHEET_NS):
            sheet_name = sheet.attrib["name"]
            relation_id = sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
            target = "xl/" + relation_map[relation_id]
            root = ET.fromstring(archive.read(target))
            rows: list[list[str]] = []
            for row in root.findall(".//a:sheetData/a:row", SPREADSHEET_NS):
                values: list[str] = []
                for cell in row.findall("a:c", SPREADSHEET_NS):
                    cell_type = cell.attrib.get("t")
                    value_node = cell.find("a:v", SPREADSHEET_NS)
                    value = ""
                    if cell_type == "s" and value_node is not None:
                        value = shared_strings[int(value_node.text)]
                    elif cell_type == "inlineStr":
                        value = "".join(node.text or "" for node in cell.iterfind(".//a:t", SPREADSHEET_NS))
                    elif value_node is not None:
                        value = value_node.text or ""
                    values.append(value.strip())
                rows.append(values)
            yield sheet_name, rows


def build_row(
    *,
    module_type: str,
    subject_code: str | None,
    scene_code: str,
    code: str,
    name: str,
    score_type: str,
    score_target: str,
    score_value: int,
    source_desc: str,
    allowed_role_codes: list[str] | None = None,
):
    sentiment = "positive" if score_type == "add" else "negative"
    dimension, tag = infer_dimension_and_tag(name, sentiment)
    return {
        "module_type": module_type,
        "subject_code": subject_code,
        "scene_code": scene_code,
        "code": code,
        "name": name,
        "score_type": score_type,
        "score_target": score_target,
        "score_value": score_value,
        "dimension": dimension,
        "tag": tag,
        "sentiment": sentiment,
        "ai_summary_text": f"{dimension} / {tag} / {'正向' if sentiment == 'positive' else '负向'}",
        "description": source_desc,
        "allowed_role_codes": allowed_role_codes or [],
        "is_high_frequency": 1 if is_high_frequency(name) else 0,
        "display_enabled": 1 if should_display(name, score_value, score_type, score_target) else 0,
        "admin_enabled": 1,
    }


def build_rows_from_legacy_xls(workbook_path: Path):
    workbook = xlrd.open_workbook(str(workbook_path))
    generated_rows = []

    for sheet_name in workbook.sheet_names():
        if sheet_name not in LEGACY_SHEET_CONFIG:
            continue
        config = LEGACY_SHEET_CONFIG[sheet_name]
        sheet = workbook.sheet_by_name(sheet_name)

        for row_idx in range(2, sheet.nrows):
            source_index = sheet.cell_value(row_idx, 0)
            rule_name = str(sheet.cell_value(row_idx, 1)).strip()
            raw_score = sheet.cell_value(row_idx, 2)
            description = str(sheet.cell_value(row_idx, 3)).strip()
            if not rule_name:
                continue

            rule_name, raw_score, description = clean_source_row(sheet_name, rule_name, raw_score, description)
            parsed = parse_score(raw_score)
            if str(source_index).strip():
                try:
                    source_no = int(float(source_index))
                except ValueError:
                    source_no = row_idx - 1
            else:
                source_no = row_idx - 1

            scene_code = infer_scene_code(rule_name)
            for score_value in parsed.values:
                expanded_name = rule_name
                if len(parsed.values) > 1:
                    expanded_name = f"{rule_name}（{signed_label(parsed.score_type, score_value)}）"
                source_desc = f"来源工作表：{sheet_name}；原始分值：{parsed.source_text}"
                if description:
                    source_desc = f"{source_desc}；说明：{description}"
                code = f"XLS_{config['sheet_code']}_{source_no:03d}_{score_value:02d}_{parsed.score_type.upper()}"
                generated_rows.append(
                    build_row(
                        module_type=config["module_type"],
                        subject_code=config["subject_code"],
                        scene_code=scene_code,
                        code=code,
                        name=expanded_name,
                        score_type=parsed.score_type,
                        score_target="student",
                        score_value=score_value,
                        source_desc=source_desc,
                    )
                )

    return generated_rows


def build_rows_from_moral_xlsx(workbook_path: Path):
    generated_rows = []
    source_no = 1
    for sheet_name, rows in iter_xlsx_rows(workbook_path):
        if not rows:
            continue
        current_score_type = None
        for row in rows:
            cells = [cell.strip() for cell in row]
            if not any(cells):
                continue
            title = cells[0] if cells else ""
            score_text = cells[1] if len(cells) > 1 else ""
            if title == "加分项":
                current_score_type = "add"
                continue
            if title == "扣分项":
                current_score_type = "deduct"
                continue
            if title in ("学生行为", "行为") or score_text == "分值":
                continue
            if current_score_type not in {"add", "deduct"} or not title or not score_text:
                continue

            score_value = int(float(score_text))
            code = f"MORAL_{source_no:03d}_{score_value:02d}_{current_score_type.upper()}"
            generated_rows.append(
                build_row(
                    module_type="general",
                    subject_code=None,
                    scene_code=infer_scene_code(title),
                    code=code,
                    name=title,
                    score_type=current_score_type,
                    score_target="student",
                    score_value=score_value,
                    source_desc=f"来源工作簿：{workbook_path.name} / {sheet_name}",
                    allowed_role_codes=[],
                )
            )
            source_no += 1
        break
    return generated_rows


def normalize_class_metric_name(raw_name: str):
    return (
        raw_name.replace("（好/差）", "")
        .replace("(好/差)", "")
        .replace("（好／差）", "")
        .replace("(好／差)", "")
        .strip()
    )


def build_rows_from_class_eval_xlsx(workbook_path: Path):
    generated_rows = []
    source_no = 1
    for sheet_name, rows in iter_xlsx_rows(workbook_path):
        if not rows:
            continue
        for row in rows[1:]:
            cells = [cell.strip() for cell in row]
            if len(cells) < 2 or not cells[0] or not cells[1]:
                continue
            metric_name = normalize_class_metric_name(cells[0])
            scene_code = infer_scene_code(metric_name)
            source_desc = f"来源工作簿：{workbook_path.name} / {sheet_name}；原始分值：{cells[1]}"

            generated_rows.append(
                build_row(
                    module_type="general",
                    subject_code=None,
                    scene_code=scene_code,
                    code=f"CLASS_{source_no:03d}_01_ADD",
                    name=f"{metric_name}优秀",
                    score_type="add",
                    score_target="class",
                    score_value=1,
                    source_desc=source_desc,
                )
            )
            generated_rows.append(
                build_row(
                    module_type="general",
                    subject_code=None,
                    scene_code=scene_code,
                    code=f"CLASS_{source_no:03d}_01_DEDUCT",
                    name=f"{metric_name}待改进",
                    score_type="deduct",
                    score_target="class",
                    score_value=1,
                    source_desc=source_desc,
                )
            )
            source_no += 1
        break
    return generated_rows


def render_sql(rows: list[dict]) -> str:
    values_sql = []
    for row in rows:
        subject_code = "NULL" if row["subject_code"] is None else sql_quote(row["subject_code"])
        allowed_role_codes = (
            "NULL"
            if not row["allowed_role_codes"]
            else sql_quote(json.dumps(row["allowed_role_codes"], ensure_ascii=False))
        )
        values_sql.append(
            "("
            "@school_id, "
            "@semester_id, "
            f"{sql_quote(row['module_type'])}, "
            f"{subject_code}, "
            f"{sql_quote(row['scene_code'])}, "
            f"{sql_quote(row['code'])}, "
            f"{sql_quote(row['name'])}, "
            f"{sql_quote(row['score_type'])}, "
            "'fixed', "
            f"{sql_quote(row['score_target'])}, "
            f"{row['score_value']}, "
            f"{sql_quote(row['dimension'])}, "
            f"{sql_quote(row['tag'])}, "
            f"{sql_quote(row['sentiment'])}, "
            f"{sql_quote(row['ai_summary_text'])}, "
            f"{sql_quote(row['description'])}, "
            f"{allowed_role_codes}, "
            f"{row['is_high_frequency']}, "
            f"{row['display_enabled']}, "
            f"{row['admin_enabled']}, "
            "'enabled', "
            "@operator_id, "
            "@operator_id, "
            "NOW(3), "
            "NOW(3)"
            ")"
        )

    return f"""SET NAMES utf8mb4;
START TRANSACTION;

SET @school_id = COALESCE(
  (SELECT `id` FROM `school` WHERE `code` = 'YYXX' ORDER BY `id` ASC LIMIT 1),
  (SELECT `id` FROM `school` ORDER BY `id` ASC LIMIT 1)
);

SET @semester_id = COALESCE(
  (SELECT `id` FROM `semester` WHERE `school_id` = @school_id AND `is_current` = 1 ORDER BY `id` DESC LIMIT 1),
  (SELECT `id` FROM `semester` WHERE `school_id` = @school_id ORDER BY `id` DESC LIMIT 1)
);

SET @operator_id = COALESCE(
  (SELECT `id` FROM `user` WHERE `school_id` = @school_id AND `username` = 'superadmin_demo' LIMIT 1),
  (SELECT `id` FROM `user` WHERE `school_id` = @school_id AND `username` = 'teacher_demo' LIMIT 1),
  (SELECT `id` FROM `user` WHERE `school_id` = @school_id ORDER BY `id` ASC LIMIT 1)
);

DELETE FROM `score_rule`
WHERE `school_id` = @school_id
  AND `semester_id` = @semester_id
  AND (
    `code` LIKE 'DOC_%'
    OR `code` LIKE 'XLS_%'
    OR `code` LIKE 'MORAL_%'
    OR `code` LIKE 'CLASS_%'
  );

INSERT INTO `score_rule` (
  `school_id`,
  `semester_id`,
  `module_type`,
  `subject_code`,
  `scene_code`,
  `code`,
  `name`,
  `score_type`,
  `score_mode`,
  `score_target`,
  `score_value`,
  `dimension`,
  `tag`,
  `sentiment`,
  `ai_summary_text`,
  `description`,
  `allowed_role_codes`,
  `is_high_frequency`,
  `display_enabled`,
  `admin_enabled`,
  `status`,
  `created_by`,
  `updated_by`,
  `created_at`,
  `updated_at`
)
VALUES
  {",\n  ".join(values_sql)};

COMMIT;
"""


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--legacy-input", required=True)
    parser.add_argument("--moral-input", required=True)
    parser.add_argument("--class-input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    rows = []
    rows.extend(build_rows_from_legacy_xls(Path(args.legacy_input)))
    rows.extend(build_rows_from_moral_xlsx(Path(args.moral_input)))
    rows.extend(build_rows_from_class_eval_xlsx(Path(args.class_input)))

    codes = [row["code"] for row in rows]
    if len(codes) != len(set(codes)):
        raise ValueError("generated duplicate rule codes")

    sql = render_sql(rows)
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(sql, encoding="utf-8")
    print(f"generated_rows={len(rows)}")
    print(f"output={output_path}")


if __name__ == "__main__":
    main()
