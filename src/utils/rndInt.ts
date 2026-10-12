const rndInt = (min: number, max: number, include: boolean | undefined)=>
  Math.floor(Math.random()*(max-min + (include?1:0))+min)

export default rndInt;