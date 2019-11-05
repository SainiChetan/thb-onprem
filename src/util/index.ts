import { IResponse, IResponseBody } from './../interface/index';
//import { timeUtils } from '@thblib/thb-util';
import { constants } from './../config/constants';

const moment = require('moment');
const AWS = require('aws-sdk');
AWS.config.update({ region: 'ap-south-1' });
const sns = new AWS.SNS({ apiVersion: '2010-03-31' });
const docClient = new AWS.DynamoDB.DocumentClient();


export function responseObj(): IResponse {
    let resBody: IResponseBody = {
        status: 0,
        message: '',
        result: '-'
    };

    return clone({
        statusCode: 200,
        body: resBody,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        }
    });
};

export function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export function getCacheTimeStamp() {
    let date = new Date();
    let day = date.getDate();
    let monthIndex = date.getMonth() + 1;
    let year = date.getFullYear();
    let cacheQueryTimestamp = day + "" + monthIndex + "" + year;
    return cacheQueryTimestamp;
}

export function cleanUpQuery(query) {
    // first value is comma
    //console.log("query.indexOf(',')==================>>>>> ",query.indexOf(','))
    if (query.indexOf(',') == 0)
        query = query.replace(',', '');

    return query;
}

export function getPartitionString() {
    // let epocTTL = new Date().setTime(new Date().getTime() + (0*60*60*1000));
    return new Date().getTime().toString();

}
export function getTTLForDuration(hours: number) {
    let epocTTL = new Date().setTime(new Date().getTime() + (hours * 60 * 60 * 1000));
    return Math.floor(epocTTL / 1000);

}

export function getEPOCHForNow() {
    let epocTTL = new Date().setTime(new Date().getTime());
    return Math.floor(epocTTL / 1000);

}
export function createResponse(statusCode: number, status: number, result: any, message: string) {
    let response = responseObj();
    response.statusCode = statusCode || response.statusCode;
    response.body.status = status || response.body.status;
    response.body.result = result || response.body.result;
    //if (process.env.NODE_ENV != 'production') {
        //response.body.result = encrypt(JSON.stringify(result)) || response.body.result;
        //response.body.iscomp = true;
    //}
    response.body.message = message || response.body.message;
    response.body = JSON.stringify(response.body);
    // response.body=response.body.replace(/\\n/g, "\\n")
    // .replace(/\\'/g, "\\'")
    // .replace(/\\"/g, '\\"')
    // .replace(/\\&/g, "\\&")
    // .replace(/\\r/g, "\\r")
    // .replace(/\\t/g, "\\t")
    // .replace(/\\b/g, "\\b")
    // .replace(/\\f/g, "\\f");
    return response;

};

// export function getCurrentTime() {
//     //return timeUtils.dateTimeStr(timeUtils.getTodayDate(), 'YYYY-MM-DD HH:mm:ss.SSS');
// };

// export function getCurrentTimeEPOCH() {
//     //return (timeUtils.getTodayDate()).getTime();
// }

export function getBigIntBasedInStatement(inputArray: string[]) {

}

export function createBatchRequestKey(key, keyValArr) {
    let array: any = [];

    for (var element of keyValArr) {
        let obj = {
            [key]: element
        };
        array.push(obj);
    }

    return array;
}


export function getCurrentTimeEPOCH() {
    return moment.utc(new Date()).utcOffset("+05:30").valueOf();
}

export function getCurrentDayStartEPOCH() {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    return moment.utc(d).utcOffset("+05:30").valueOf();
}



export function getCurrentDate() {
    return moment.utc(new Date()).utcOffset("+05:30").format('YYYY-MM-DD');
}

export function getCurrentTime() {
    return moment.utc(new Date()).utcOffset("+05:30").format('YYYY-MM-DD HH:mm:ss');
}

export async function sendErrorEmail(errorMessage, subject) {
    // Create publish parameters
    var params = {
        Subject: subject,
        Message: errorMessage, /* required */
        TopicArn: 'arn:aws:sns:ap-south-1:983637169828:athena_layer_error'
    };

    try {
        await sns.publish(params).promise();
    } catch (e) {
        console.log(e);
    }
    return;
}

export async function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms)
    })

}


// export async function getAthenaLabnameFromServerlist(servername) {

//     var params = {
//         TableName: constants.server_list_dynamo_table,
//         KeyConditionExpression: "server =:server",
//         ExpressionAttributeValues: {
//             ":server": servername
//         },
//         ProjectionExpression: "athenalabname"
//     };

//     try {
//         const data = await docClient.query(params).promise();
//         let item = (data.Items && data.Items.length > 0) ? data.Items[0] : null;

//         console.log(JSON.stringify(data));
//         return {
//             err: null,
//             result: item
//         }

//     } catch (err) {
//         console.log(err);
//         console.log(err.stack);
//         return {
//             err: err,
//             result: null
//         }
//     }
// }

// export async function getServerAndClientNameFromAthenaLabname(athenalabname) {

//     var params = {
//         TableName: constants.server_list_dynamo_table,
//         IndexName: 'createdDateIndex',
//         ScanIndexForward: false,
//         KeyConditionExpression: "athenalabname = :athenalabname",
//         ExpressionAttributeValues: {
//             ":servername": athenalabname
//         }
//     };

//     try {
//         const data = await docClient.query(params).promise();
//         let item = (data.Items && data.Items.length > 0) ? data.Items[0] : null;

//         console.log(JSON.stringify(data));
//         return {
//             err: null,
//             result: item
//         }

//     } catch (err) {
//         console.log(err);
//         console.log(err.stack);
//         return {
//             err: err,
//             result: null
//         }
//     }
// }

export function getBucketName() {
    if (process.env.NODE_ENV != "production") {
        return "thb-communications-beta";
    }
    return "thb-communications";
}



