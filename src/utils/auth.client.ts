import { signIn } from "next-auth/react";

export async function authenticate(email: string, password: string) {
  try {
    const r = await signIn("credentials", {
      email, // đổi username thành email
      password,
      redirect: false,
    });
    return r;
  } catch (error) {
    console.log('>>>error: ', error);
    return {
      error: "Internal server error",
      code: 0,
    };
    // if((error as any).name === 'InvalidEmailPasswordError'){
    //     return {
    //         error: (error as any).type,
    //         code: 401
    //     }
    // }
  }
}