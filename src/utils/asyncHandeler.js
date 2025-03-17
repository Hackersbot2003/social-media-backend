const asyncHandeler = (requestHandeler)=>{
  return (req,res,next) =>{
    Promise.resolve(requestHandeler(req,res,next))
    .catch((err)=>next(err))
  }
}



export {asyncHandeler}

// const asyncHandeler =()=>{}
// const asyncHandeler =(func)=>()=>{}
// const asyncHandeler =(func)=>async()=>{}
//higher order function => function which takes function as parameter and also returns it

// const asyncHandeler =(fn)=>async (req,res,next)=>{
//   try {
//     await fn(req,res,next)
//   } catch (error) {
//     res.status(err.code || 500).json({
//       success:false,
//       message: err.message,
//     })
    
//   }
// }