export { };
// https://bobbyhadz.com/blog/typescript-make-types-global#declare-global-types-in-typescript

declare global {
    interface IRequest {
        url: string;
        method: string;
        body?: { [key: string]: any };
        queryParams?: any;
        useCredentials?: boolean;
        headers?: any;
        nextOption?: any;
    }

    interface IBackendRes<T> {
        error?: string | string[];
        message: string;
        statusCode: number | string;
        data?: T;
    }

    interface SignInResponse {
        error: string | null;
        status: number;
        ok: boolean;
        url: string | null;
        code: number | null;
    }

    interface UserResponse {
        email: string;
        id: string;
        full_name: string;
        is_active: boolean;
        is_superuser: boolean;
        created_at: string;
        updated_at: string;
    }

    interface IModelPaginate<T> {
        meta: {
            current: number;
            pageSize: number;
            pages: number;
            total: number;
        },
        result: T[]
    }

    interface ILogin {
        user: {
            id: string;
            name: string;
            email: string;
            role: string;
            department: string;
        },
        access_token: string;   
    }

}
