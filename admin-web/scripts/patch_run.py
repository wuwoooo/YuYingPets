from pathlib import Path
ROOT = Path("/Users/wuwoo/Desktop/work/_育英星宠/YuYingPets/admin-web")
PAGE = ROOT / "src/pages/PresentationModePage.tsx"
SCRIPTS = ROOT / "scripts"
t = PAGE.read_text(encoding="utf-8")

i = t.find("presentation-grade-3d-bars")
st = t.rfind("\n          <div className=\"presentation-panel fade-up-panel\">", 0, i)
en = t.find("\n          <div className=\"presentation-panel fade-up-panel\">", i)
t = t[:st] + (SCRIPTS / "patch-left-fragment.txt").read_text(encoding="utf-8") + t[en:]

i = t.find("{heatCols.map")
st = t.rfind("<div className=\"presentation-heatmap\">", 0, i)
e = t.find("</div>", t.find("+12%", st)) + 6
t = t[:st] + (SCRIPTS / "patch-heat-fragment.txt").read_text(encoding="utf-8") + t[e:]

i = t.find("topBehaviorsMock")
st = t.rfind("<div className=\"presentation-top-behaviors\">", 0, i)
e = t.find("             </div>", i) + 14
t = t[:st] + (SCRIPTS / "patch-behaviors-fragment.txt").read_text(encoding="utf-8") + t[e:]

old_honor = """            <motion.div className=\"presentation-honor-grid\">
              {topHonors.map((item) => ("""
old_honor = """            <motion.div className=\"presentation-honor-grid\">
              {topHonors.map((item) => ("""
t = t[:st] + (SCRIPTS / "patch-behaviors-fragment.txt").read_text(encoding="utf-8") + t[e:]

i = t.find("topHonors.map")
st = t.rfind("            <div className=\"presentation-honor-grid\">", 0, i)
e = t.find("            </div>\n          </div>\n          <div className=\"presentation-panel fade-up-panel bottom-panel\">", st)
new_honor = (SCRIPTS / "patch-honor-fragment.txt").read_text(encoding="utf-8") if (SCRIPTS / "patch-honor-fragment.txt").exists() else None
if new_honor:
    t = t[:st] + new_honor + t[e:]

i = t.find("presentationAlerts.map")
st = t.rfind("            <div className=\"presentation-alert-list\">", 0, i)
e = t.find("            <div className=\"presentation-panel-footnote\">家校共育", st)
new_risk = (SCRIPTS / "patch-risk-fragment.txt").read_text(encoding="utf-8") if (SCRIPTS / "patch-risk-fragment.txt").exists() else None
if new_risk:
    t = t[:st] + new_risk + t[e:]

PAGE.write_text(t, encoding="utf-8")
print("patched")
