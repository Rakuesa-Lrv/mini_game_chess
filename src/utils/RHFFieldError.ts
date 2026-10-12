import type { FieldError , MultipleFieldErrors  } from "react-hook-form";

/**
 * 单字段-单类型 
 * 
 * 任意数目消息
 */
export const RHFFieldError = (message: string | string[], type='validation', mainErrMsg?: string ): FieldError  | undefined =>  {

  if(!message.length) return undefined;

  let msg: string | undefined;
  let multiMsg: string[] | undefined;

  ( !(typeof message === 'string') )
  ? (()=>{ 
    msg = mainErrMsg || message[0];
    (message.length===1)
    ? (multiMsg = message)
    : (multiMsg = undefined)
  })()
  : (()=> {
    msg = message;
    multiMsg = undefined;
  })();

  return {
    type,
    message: msg,
    types: (
      multiMsg?.reduce((acc, m, i)=> {
        acc[`rule${i}`] = m;
        return acc;
      }, {} as Record<`rule${number}`, string>)
    ) as MultipleFieldErrors,
  }
}

export const newRHFFieldError = (type='validation')=> ({
  type,
  message: undefined,
  types: undefined,
} as FieldError);

/**
 * 多字段直接push
 */
export const pushRHFMultipleFieldErrors = (
  fieldError: FieldError,
  k_v: { key: string, msg: string },
  prefix?: string,
) => {
  fieldError.types || (fieldError.types = {} as MultipleFieldErrors);
  const { key, msg } = k_v;
  const k = prefix? `${prefix}.${key}`: key;
  fieldError.types[k] = msg;
}