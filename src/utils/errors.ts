/* eslint-disable @typescript-eslint/no-explicit-any */

export class CustomAuthError extends Error {
  type: string;

  constructor(message?: any) {
    super();

    this.type = message;
  }
}

export class InvalidEmailPasswordError extends Error {
  static type = "Email/Password không hợp lệ!"
}

export class InactiveAccountError extends Error {
  static type = "Tài khoản chưa được kích hoạt!"
}

export class ForbiddenError extends Error {
  static type = "Không có quyền truy cập!"
}

export class NotFoundError extends Error {
  static type = "Không tìm thấy trang!"
}

export class RequestTimeOutError extends Error {
  static type = "Yêu cầu đã hết thời gian!"
}
