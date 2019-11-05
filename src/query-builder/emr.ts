import { IEmrModuleConditions, IQueryBuilderResponse, IEmrCondition } from '../interface/index'

let normalConditionViewAlias = 'emr_t1';


import { constants } from '../config/constants'
//let billing_items_table = "billing_items_cta";

//INITIALLY IT WAS biomarker_text
let emr_table = function () {
    return `"${constants.database()}"."emr"`;
};

export async function getQueryForEmr(condtions: IEmrModuleConditions, dbname):
    Promise<IQueryBuilderResponse> {
    let baseQuery = '';
    let responseObject: IQueryBuilderResponse = {
        query: '',
        alias: [],
        aliasCond: []
    };
    if (condtions.normal && condtions.normal.length > 0) {
        //baseQuery += await getQueryForNormalCondition(condtions.normal, dbname);
        //changed after department,service feature came into play
        baseQuery += await getQueryForNormalConditionNew(condtions.normal, dbname);
        responseObject['alias'].push(normalConditionViewAlias);
        let aliasCondition = (condtions.compcondition == 'OR') ? " UNION" : " INTERSECT";
        responseObject['aliasCond'].push(aliasCondition);
    }

    responseObject.query = baseQuery;
    return responseObject;

}


async function getQueryForNormalConditionNew(normalConditions: IEmrCondition[], dbName) {

    let includeCompleteBaseQuery = `select distinct patientremoteid as patientid from ${emr_table()} 
    where labname = '${dbName}'`;
    let excludeCompleteBaseQuery = '';
    let excludeCounter = 0;
    let includeCounter = 0;
    for (var counter in normalConditions) {
        let condition = normalConditions[counter];

        let currentWhereClause = await getWhereClauseExtensionForConditionNew(condition, parseInt(counter), dbName);
        if (condition.scope == 'include') {
            let u_i_cond = (condition.dbCond == 'AND') ? ' INTERSECT' : ' UNION';
            if (includeCounter == 0) {
                u_i_cond = ' INTERSECT'
            }
            includeCompleteBaseQuery += `${u_i_cond} select distinct patientremoteid as patientid from ${emr_table()} 
            where labname = '${dbName}' ${currentWhereClause}`;
            includeCounter++;
        }
        else if (condition.scope == 'exclude') {
            let u_i_cond = (condition.dbCond == 'AND') ? ' INTERSECT' : ' UNION';
            if (excludeCounter == 0) {
                u_i_cond = ''
            }
            excludeCompleteBaseQuery += `${u_i_cond} select distinct patientremoteid as patientid from ${emr_table()} 
            where labname = '${dbName}' ${currentWhereClause}`;
            excludeCounter++;
        }
    }

    let exceptClause = '';
    if (excludeCounter > 0) {
        exceptClause = `EXCEPT 
        (
        ${excludeCompleteBaseQuery}
        )`
    }

    let normalQuery = `${normalConditionViewAlias} AS (
     (
         ${includeCompleteBaseQuery}
     )
     ${exceptClause}

    )`

    return normalQuery;

}

// async function getQueryForNormalConditionNew(normalConditions: IEmrCondition[], dbName) {

//     let includeCompleteBaseQuery = `select distinct patientremoteid as patientid from ${emr_table()} 
//     where labname = '${dbName}'`;
//     let excludeCompleteBaseQuery = '';
//     let excludeCounter = 0;
//     let includeCounter = 0;
//     for (var counter in normalConditions) {
//         let condition = normalConditions[counter];

//         let currentWhereClauseQuery = await getWhereClauseExtensionForConditionNew(condition,parseInt(counter),dbName);
//         if (condition.scope == 'include') {
//             let u_i_cond = (condition.dbCond == 'AND') ? ' INTERSECT' : ' UNION';
//             if (includeCounter == 0) {
//                 u_i_cond = ' INTERSECT'
//             }
//             // includeCompleteBaseQuery += ` ${u_i_cond} select distinct patientid from ${billing_items_table} 
//             // where labname = '${dbName}' ${currentWhereClause}`;
//             includeCompleteBaseQuery += ` ${u_i_cond} ${currentWhereClauseQuery}`;
//             includeCounter++;
//         }
//         else if (condition.scope == 'exclude') {
//             let u_i_cond = (condition.dbCond == 'AND') ? ' INTERSECT' : ' UNION';
//             if (excludeCounter == 0) {
//                 u_i_cond = ''
//             }
//             // excludeCompleteBaseQuery += ` ${u_i_cond} select distinct patientid from ${billing_items_table} 
//             // where labname = '${dbName}' ${currentWhereClause}`;
//             excludeCompleteBaseQuery += ` ${u_i_cond} ${currentWhereClauseQuery}`;
//             excludeCounter++;
//         }
//     }

//     let exceptClause = '';
//     if (excludeCounter > 0) {
//         exceptClause = `EXCEPT 
//         (
//         ${excludeCompleteBaseQuery}
//         )`
//     }

//     let normalQuery = `${normalConditionViewAlias} AS (
//      (
//          ${includeCompleteBaseQuery}
//      )
//      ${exceptClause}

//     )`

//     return normalQuery;

// }


function getStatementForConditionNew(billCondition: IEmrCondition, dbName: string) {
    //CHANGED AFTER INCLUSION OF EXCEPT BLOCK
    //let singleConditionSummary = (scope == 'include') ? '((' : '(NOT(';
    let singleConditionSummary = 'AND ((';
    //changes made for condition====
    //itemid changed from text to bigint
    if (billCondition.factor == 'level1' && billCondition.items) {
        //NEVER DONE CONDITION
        if (billCondition.condition == 'ned') {
            billCondition.items.forEach(function (item, index) {
                if (index == 0) {
                    singleConditionSummary += `level1 != '${item}'`;
                }
                else {
                    singleConditionSummary += ` OR level1 != '${item}'`;
                }
            });
        }
        else {

            billCondition.items.forEach(function (item, index) {
                if (index == 0) {
                    singleConditionSummary += `level1 = '${item}'`;
                }
                else {
                    singleConditionSummary += ` OR level1 = '${item}'`;
                }
            });

        }
    }



    //=========================== CONDITIONAL SEGMENT =====================================
    singleConditionSummary += ")";
    // "Have visited (atleast once)": "hv",
    // "Never Visited": "nv",
    // "Visited after (date)":"va",
    // "Visited before (date)":"vb",
    // "Have visited between":"hvbt",
    // "Last visited":"lv"
    let cond = billCondition.condition;
    switch (cond) {
        case 'da':
            singleConditionSummary += ` AND bookingdate > timestamp '${billCondition.date}'`;
            break;
        case 'nda':
            singleConditionSummary += ` AND bookingdate < timestamp  '${billCondition.date}'`;
            break;
        case 'bt':
            singleConditionSummary += ` AND (bookingdate >= timestamp '${billCondition.date1}' AND bookingdate <= timestamp '${billCondition.date2}')`;
            break;
        case 'hvbt':
            singleConditionSummary += ` AND (bookingdate >= timestamp '${billCondition.date1}' AND bookingdate <= timestamp '${billCondition.date2}')`;
            break;
        case 'va':
            singleConditionSummary += ` AND (bookingdate > timestamp '${billCondition.date}')`;
            break;
        case 'vb':
            singleConditionSummary += ` AND (bookingdate < timestamp '${billCondition.date}')`;
            break;
        // case 'lv':
        //     singleConditionSummary += ` AND (billdate = timestamp '${billCondition.date}')`;
        //     break;
    }
    singleConditionSummary += ")";
    let currentWherCluaseQuery = `select distinct patientremoteid as patientid from ${emr_table()} 
    where labname = '${dbName}' ${singleConditionSummary}`;
    return currentWherCluaseQuery;
}



function getStatementForCondition(items: string[], cond, date, date1, date2, scope) {
    //CHANGED AFTER INCLUSION OF EXCEPT BLOCK
    //let singleConditionSummary = (scope == 'include') ? '((' : '(NOT(';
    let singleConditionSummary = '((';
    //changes made for condition====
    //itemid changed from text to bigint
    items.forEach(function (item, index) {
        if (index == 0) {
            singleConditionSummary += `itemid = '${item}'`;
        }
        else {
            singleConditionSummary += ` OR itemid = '${item}'`;
        }
    });

    singleConditionSummary += ")";
    //initially it was createddate
    switch (cond) {
        case 'da':
            singleConditionSummary += ` AND bookingdate > timestamp '${date}'`;
            break;
        case 'nda':
            singleConditionSummary += ` AND bookingdate < timestamp  '${date}'`;
            break;
        case 'bt':
            singleConditionSummary += ` AND (bookingdate >= timestamp '${date1}' AND bookingdate <= timestamp '${date2}')`;
            break;
    }
    singleConditionSummary += ")";

    return singleConditionSummary;


}


async function getWhereClauseExtensionForConditionNew(condition, counter: number, labName : string) {
    let bioMarkersWhereConditions = '';
    //let OR_AND_OP = counter == 0 ? 'AND' : condition.dbCond;
    let OR_AND_OP = 'AND';
    if (condition.condition == 'bt') {
        bioMarkersWhereConditions += ` ${OR_AND_OP} (${condition.factor} = '${condition.textval}' and (valuenum > ${condition.value1} and valuenum < ${condition.value2}))`
    }
    else if (condition.condition == 'da') {
        bioMarkersWhereConditions += ` ${OR_AND_OP} (${condition.factor} = '${condition.textval}' and bookingdate >= timestamp '${condition.value}')`
    }
    //Changed after observation
    else if (condition.condition == 'nda') {
        //bioMarkersWhereConditions += ` ${OR_AND_OP} (biomarkercode = '${condition.biomarkercode}' and NOT(bookingdate > timestamp '${condition.value}'))`
        bioMarkersWhereConditions += ` ${OR_AND_OP} (${condition.factor} = '${condition.textval}' and 
        patientid IN(
            select patientid from
            (
                                 select patientid,max(bookingdate) as maxbookingdate 
                                 FROM ${emr_table()}  
                                 where labname = '${labName}' 
                                 and level1 = '${condition.textval}'                                
                                 GROUP BY patientid
                
             )
             where maxbookingdate <= timestamp '${condition.value}'
             )
             
        )`
    }
    //exists condition
    else if (condition.condition == 'ex') {
        bioMarkersWhereConditions += ` ${OR_AND_OP} (${condition.factor} = '${condition.textval}')`
    }
    else if (condition.condition == 'ext') {
        bioMarkersWhereConditions += ` ${OR_AND_OP} (${condition.factor} = '${condition.textval}')`
    
    }
    //condition for text based biomarkers
    else if (condition.condition == 'contains') {
        bioMarkersWhereConditions += ` ${OR_AND_OP} (${condition.factor} = '${condition.textval}' and regexp_like(lower(result), lower('${condition.text}')))`
    }
    else
        bioMarkersWhereConditions += ` ${OR_AND_OP} (${condition.factor} = '${condition.textval}' and valuenum ${condition.condition} ${condition.value})`

    return bioMarkersWhereConditions;

}