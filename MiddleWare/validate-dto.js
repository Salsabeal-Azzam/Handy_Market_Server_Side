

function validateDto(ajvValidate) {
    return (req, res, next) => {
      try {
        const valid = ajvValidate(req.body);
        if (!valid){
          const errors = ajvValidate.errors;
          console.log(errors);
          console.log(ajvValidate);
          res.status(400).json({message: 'Error From Validation ' + errors});
        }else{
            next();
        }
      } catch (error) {
        //console.log(error);
        res.status(500).json({message:"Catch Error Validate Middel" , error});
      }
    };
  };
  
  module.exports = validateDto;
  