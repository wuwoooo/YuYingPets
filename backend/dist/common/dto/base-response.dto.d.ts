export declare class BaseResponseDto<T = unknown> {
    code: number;
    message: string;
    data?: T;
}
