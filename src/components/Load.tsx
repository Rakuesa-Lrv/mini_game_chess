import { useForm } from 'react-hook-form';
import type { Resolver, FieldErrors, ValidateResult } from 'react-hook-form';

import classes from './Load.module.css';

import BackDrop from './BackDrop';

import { isFENValid, notationN, type notation } from '../hooks/FEN';
import { useStoreField } from '../hooks/useStoreField';
import useDspStore from '../hooks/stores/useDspStore';
import useGameStore from '../hooks/stores/useGameStore';
import { RHFFieldError, newRHFFieldError, pushRHFMultipleFieldErrors } from '../utils/RHFFieldError';


interface Inputs {
  // notation: notation,
  content: string,
}

const resolver:  Resolver<Inputs, any, Inputs> = (
  values, 
  context, 
  options
)=> {
  const errors = {} as FieldErrors<Inputs>;

  if(!values.content) {
    errors.content = RHFFieldError('不能为空', 'required');
  }else {
    const { isValid, errors: err} = isFENValid(values.content);
    isValid || (()=> {
      errors.content = newRHFFieldError();
      for(const value of Object.values(err)) {
        value.msg.forEach((msg, idx)=> {
          pushRHFMultipleFieldErrors(errors.content!, {key: `${idx}`, msg}, value.type)
        })
      }
    })();
  }
  

  if(Object.keys(errors).length > 0) {
    return { values: {}, errors }
  }
  return { values, errors: {} }
}

interface errDspProp {
  errors: FieldErrors<Inputs>
}
const ErrDsp = ({
  errors: err,
}: errDspProp)=> {
  const hasErr = err.content?.types || err.content?.message;
  return (
    <div
      className={classes.errors}
      style={{
        gridTemplateRows: hasErr? '1fr': '0fr',
        padding: hasErr? '.4rem': '0',
        marginTop: hasErr? '2rem': '0',
      }}
    >
      <div style={{ minHeight: 0, overflow: 'hidden' }}>
      { err.content?.types && (()=> {
        const errClct = {} as Record<string, ValidateResult[]>
        for(const [key, value] of Object.entries(err.content.types)) {
          const k = key.split('.')[0];
          errClct[k] || (errClct[k]=[]);
          errClct[k].push(value);
        }
        return Object.entries(errClct).map(([key, value])=> (
          <div
            className={classes.error}
            key={`${key}`}
          >
            <p className={classes.type}>{key}</p>
            {value.map((msg, idx)=> (
              <p 
                className={classes.msg}
                key={`${key}.${idx}`}
              >{msg}</p>
            ))}
          </div>
        )) 
        
      })() }
      { err.content?.message && (
        <div
          className={classes.error}
        >
          <p className={classes.type}>{err.content?.type}</p>
          <p className={classes.msg}>{err.content?.message}</p>
        </div>
      ) }
      </div>

    </div>
  )
}

const Load = ()=> {

  const { dispatch } = useStoreField(useGameStore, [
    'dispatch'
  ])

  const { changeDisplay } = useStoreField(useDspStore, [
    'changeDisplay'
  ])

  const { 
    register,
    handleSubmit, 
    formState: { errors }
  } = useForm({
    defaultValues: {
      // notation: 'FEN',
      content: '',
    } as Inputs,
    mode: 'onSubmit',
    criteriaMode: 'all',
    resolver: resolver,
  });

  return (
    <BackDrop
      onClose={()=> {
        changeDisplay({ type: 'CLOSE', name: 'load' })
      }}
    >

    <div
      className={classes.load}
    >
      <form
        className={classes.loadForm}
        onSubmit={handleSubmit((inputs)=> {
          changeDisplay({ type: 'CLOSE', name: 'load' });
          dispatch({ type: 'LOAD', FEN: inputs.content });
        }, (err)=> {
          console.log(err);
        })}
      >
        <input
          {...register('content')}
          autoComplete='off'
          type='text'
          placeholder='FEN格式棋谱'
        />

        <button
          type='submit'
        >
          加载
        </button>
      </form>

    <ErrDsp 
      errors={errors}
    />

    </div>

    </BackDrop>
  )
}

export default Load;