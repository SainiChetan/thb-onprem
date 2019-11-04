import {getCompleteQuery} from './base-builder'

// import {IQueryConditions} from '../interface/index'




// let condObj = {
//     "dbname":"s_suburbandb",
//     "biomarker":{
//         "normal":[
//             {
//             "biomarkercode": 'b00043',
//             "value": 6,
//             "condition": '>',
//             "dbCond" : 'OR',
//             "scope"  : "include"
//         }],
//         "latest":[

//             {
//                 "biomarkercode": 'b00043',
//                 "value": 7,
//                 "condition": '>',
//                 "dbCond" : 'OR',
//                 "scope"  : "include"
//             }
//         ]
//     }

// }



// let condObj = {
//   "dbname": "spectrum_hospital",
//   "notification_id": "fxr9SA0BJ7Y:APA91bF5OpeQvvAPMoFAoyjuEfQ5crFS820OgxytJUKarLrLdAcH_LA9hnxDiL-y2fa1QJAw5mhOnVv7UMpdIwlOkDt8ibNHFBCz69JVUTFWuywsQ7d8LLTi-Fzqu_VXQzXEXi_6UtzR",
//   "click_action": "https://betapepv2.hlthclub.in/spectrum_hospital/query-builder",
//   "dcache": 1,
//   "patient": {
//     "normal": [
//       {
//         "factor": "age",
//         "condition": "bt",
//         "value1": 5,
//         "value2": 89,
//         "dbCond": "AND",
//         "scope": "include"
//       }
//     ],
//     "compcondition": "AND"
//   }
// }
let condObj = {
  "dbname":"pepdmr",
  "dcache": 1,
  "notification_id": "fxr9SA0BJ7Y:APA91bF5OpeQvvAPMoFAoyjuEfQ5crFS820OgxytJUKarLrLdAcH_LA9hnxDiL-y2fa1QJAw5mhOnVv7UMpdIwlOkDt8ibNHFBCz69JVUTFWuywsQ7d8LLTi-Fzqu_VXQzXEXi_6UtzR",
  "click_action": "https://betapepv2.hlthclub.in/spectrum_hospital/query-builder",
  // "patientleads": {
  //     "normal": [
  //       // {
  //       //   "factor": "age",
  //       //   "condition": "bt",
  //       //   "value1": 5,
  //       //   "value2": 89,
  //       //   "dbCond": "AND",
  //       //   "scope": "include"
  //       // }
  //       {
  //         "factor": "labname",
  //         "value": "pepdmr",
  //         "condition": "=",
  //         "dbCond": "AND",
  //         "scope": "include"
  //       }
  //     ],
  //     "compcondition": "AND"
  //   }
  "patientleads": {
    "normal": [
      {
        "factor": "all",
        "condition": "=",
        "value": "all",
        "dbCond": "AND",
        "scope": "include"
      }
    ],
    "compcondition": "AND"
}
}
async function testFunc(){
  await getCompleteQuery(condObj);
  console.log("done");

}

testFunc()

// async function delaytest(){
//     for(var i=0;i<5;i++){
//         await sleep(2000);
//         console.log("testing in 1 sec................");

//     }

// }


// async function sleep(ms){
//     return new Promise(resolve=>{
//         setTimeout(resolve,ms)
//     })

// }

// delaytest();