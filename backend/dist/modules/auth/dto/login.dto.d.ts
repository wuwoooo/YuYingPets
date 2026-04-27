export declare enum LoginTerminalType {
    ADMIN = "admin",
    DISPLAY = "display"
}
export declare class LoginDto {
    username: string;
    password: string;
    terminalType: LoginTerminalType;
}
