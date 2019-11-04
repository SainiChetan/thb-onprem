import { IBillingModuleConditions, IQueryBuilderResponse, IBillingCondition } from '../interface/index'

let normalConditionViewAlias = 'bill_t1';


import { constants } from '../config/constants'
//let billing_items_table = "billing_items_cta";

//INITIALLY IT WAS biomarker_text
let billing_items_table = function () {
    return `"${constants.database()}"."billing_items_cta"`;
};

export async function getQueryForBilling(condtions: IBillingModuleConditions, dbname):
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



export async function getQueryForNormalCondition(normalConditions: IBillingCondition[], dbName: string) {

    let billingWhereConditions = `where labname = '${dbName}'`;
    let exceptWhereBlock = '';

    for (var counter in normalConditions) {
        let condition: IBillingCondition = normalConditions[counter];
        if (condition.scope == 'include') {
            billingWhereConditions += ' AND ' + getStatementForCondition(condition.items, condition.condition, condition.date, condition.date1, condition.date2, condition.scope);
        }
        else {
            exceptWhereBlock += ' AND ' + getStatementForCondition(condition.items, condition.condition, condition.date, condition.date1, condition.date2, condition.scope);
        }

    }

    let exceptBlock = '';
    if (exceptWhereBlock.length > 1) {
        exceptBlock = `EXCEPT
         select patientid from ${billing_items_table()} 
        where labname = '${dbName}' ${exceptWhereBlock}`;
    }

    let finalNormalQuery = `${normalConditionViewAlias} AS 
    (
        select patientid from ${billing_items_table()} ${billingWhereConditions}
        ${exceptBlock}
    )`;
    return finalNormalQuery;
}


async function getQueryForNormalConditionNew(normalConditions: IBillingCondition[], dbName) {

    let includeCompleteBaseQuery = `select distinct patientid from ${billing_items_table()} 
    where labname = '${dbName}'`;
    let excludeCompleteBaseQuery = '';
    let excludeCounter = 0;
    let includeCounter = 0;
    for (var counter in normalConditions) {
        let condition = normalConditions[counter];

        let currentWhereClauseQuery = await getStatementForConditionNew(condition, dbName);
        if (condition.scope == 'include') {
            let u_i_cond = (condition.dbCond == 'AND') ? ' INTERSECT' : ' UNION';
            if (includeCounter == 0) {
                u_i_cond = ' INTERSECT'
            }
            // includeCompleteBaseQuery += ` ${u_i_cond} select distinct patientid from ${billing_items_table} 
            // where labname = '${dbName}' ${currentWhereClause}`;
            includeCompleteBaseQuery += ` ${u_i_cond} ${currentWhereClauseQuery}`;
            includeCounter++;
        }
        else if (condition.scope == 'exclude') {
            let u_i_cond = (condition.dbCond == 'AND') ? ' INTERSECT' : ' UNION';
            if (excludeCounter == 0) {
                u_i_cond = ''
            }
            // excludeCompleteBaseQuery += ` ${u_i_cond} select distinct patientid from ${billing_items_table} 
            // where labname = '${dbName}' ${currentWhereClause}`;
            excludeCompleteBaseQuery += ` ${u_i_cond} ${currentWhereClauseQuery}`;
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


function getStatementForConditionNew(billCondition: IBillingCondition, dbName: string) {
    //CHANGED AFTER INCLUSION OF EXCEPT BLOCK
    //let singleConditionSummary = (scope == 'include') ? '((' : '(NOT(';
    let singleConditionSummary = 'AND ((';
    //changes made for condition====
    //itemid changed from text to bigint
    if (billCondition.factor == 'billingitems' && billCondition.items) {
        //NEVER DONE CONDITION
        if (billCondition.condition == 'ned') {
            billCondition.items.forEach(function (item, index) {
                if (index == 0) {
                    singleConditionSummary += `itemid != ${item}`;
                }
                else {
                    singleConditionSummary += ` OR itemid != ${item}`;
                }
            });
        }
        else {

            billCondition.items.forEach(function (item, index) {
                if (index == 0) {
                    singleConditionSummary += `itemid = ${item}`;
                }
                else {
                    singleConditionSummary += ` OR itemid = ${item}`;
                }
            });

        }
    }

    if (billCondition.factor == 'package' && billCondition.items) {
        if (billCondition.condition == 'ned') {
            billCondition.items.forEach(function (item, index) {
                if (index == 0) {
                    singleConditionSummary += `lower(packageid) != lower('${item}')`;
                }
                else {
                    singleConditionSummary += ` OR lower(packageid) != lower('${item}')`;
                }
            });

        }
        else {
            billCondition.items.forEach(function (item, index) {
                if (index == 0) {
                    singleConditionSummary += `lower(packageid) = lower('${item}')`;
                }
                else {
                    singleConditionSummary += ` OR lower(packageid) = lower('${item}')`;
                }
            });
        }
    }

    if (billCondition.factor == 'department' && billCondition.value) {
        if (billCondition.condition == 'hv') {
            singleConditionSummary += `lower(departmentid) = lower('${billCondition.value}')`;
        }
        else if (billCondition.condition == 'nv') {
            singleConditionSummary += `lower(departmentid) != lower('${billCondition.value}')`;

        }
        else if(billCondition.condition == 'lv'){
            singleConditionSummary =` select patientid from
            (
                SELECT distinct patientid FROM (
                SELECT patientid, departmentid,
                DENSE_RANK() OVER (PARTITION BY patientid ORDER BY billdate DESC, labbillid DESC) AS rnk
                FROM billing_items_cta
                where labname = '${dbName}'
               ) where rnk = 1 and lower(departmentid) = lower('${billCondition.value}')
            )`;
            //singleConditionSummary += ")";
            return singleConditionSummary;

        }
        else {
            singleConditionSummary += `lower(departmentid) = lower('${billCondition.value}')`;
        }
    }

    if (billCondition.factor == 'patienttype' && billCondition.value) {
        singleConditionSummary += `lower(patienttypeid) = lower('${billCondition.value}')`;
    }


    if (billCondition.factor == 'servicetype' && billCondition.items) {
        let quotedSTCommaSeparated = "'" + billCondition.items.join("','") + "'";
        quotedSTCommaSeparated = quotedSTCommaSeparated.toLowerCase();
        if (billCondition.condition == 'nv') {
            singleConditionSummary += `lower(serviceid) NOT IN (${quotedSTCommaSeparated})`;

        }
        else if(billCondition.condition == 'lv'){
            singleConditionSummary =` select patientid from
            (
                SELECT distinct patientid FROM (
                SELECT patientid, serviceid,
                DENSE_RANK() OVER (PARTITION BY patientid ORDER BY billdate DESC, labbillid DESC) AS rnk
                FROM billing_items_cta
                where labname = '${dbName}'
               ) where rnk = 1 and lower(serviceid) IN (${quotedSTCommaSeparated})
            )`;
           // singleConditionSummary += ")";changes servi
            return singleConditionSummary;

        }
        else {
            singleConditionSummary += `lower(serviceid) IN (${quotedSTCommaSeparated})`;

        }
    }

    if (billCondition.factor == 'referalname' && billCondition.value) {
        if (billCondition.condition == 'neq') {
            singleConditionSummary += `lower(referalname) != lower('${billCondition.value.trim()}')`;
        }
        else if (billCondition.condition == 'contains') {
            singleConditionSummary += ` regexp_like(lower(referalname), lower('${billCondition.value.trim()}'))`;
        }
        //todo 
        else {
            singleConditionSummary += `lower(referalname) = lower('${billCondition.value.trim()}')`;

        }
    }

    if (billCondition.factor == 'referaldoctor' && billCondition.value) {
        if (billCondition.condition == 'neq') {
            singleConditionSummary += `doctorid != ${billCondition.value}`;
        }
        else {
            singleConditionSummary += `doctorid = ${billCondition.value}`;

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
            singleConditionSummary += ` AND billdate > timestamp '${billCondition.date}'`;
            break;
        case 'nda':
            singleConditionSummary += ` AND billdate < timestamp  '${billCondition.date}'`;
            break;
        case 'bt':
            singleConditionSummary += ` AND (billdate >= timestamp '${billCondition.date1}' AND billdate <= timestamp '${billCondition.date2}')`;
            break;
        case 'hvbt':
            singleConditionSummary += ` AND (billdate >= timestamp '${billCondition.date1}' AND billdate <= timestamp '${billCondition.date2}')`;
            break;
        case 'va':
            singleConditionSummary += ` AND (billdate > timestamp '${billCondition.date}')`;
            break;
        case 'vb':
            singleConditionSummary += ` AND (billdate < timestamp '${billCondition.date}')`;
            break;
        // case 'lv':
        //     singleConditionSummary += ` AND (billdate = timestamp '${billCondition.date}')`;
        //     break;
    }
    singleConditionSummary += ")";
    let currentWherCluaseQuery = `select distinct patientid from ${billing_items_table()} 
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
            singleConditionSummary += `itemid = ${item}`;
        }
        else {
            singleConditionSummary += ` OR itemid = ${item}`;
        }
    });

    singleConditionSummary += ")";
    //initially it was createddate
    switch (cond) {
        case 'da':
            singleConditionSummary += ` AND billdate > timestamp '${date}'`;
            break;
        case 'nda':
            singleConditionSummary += ` AND billdate < timestamp  '${date}'`;
            break;
        case 'bt':
            singleConditionSummary += ` AND (billdate >= timestamp '${date1}' AND billdate <= timestamp '${date2}')`;
            break;
    }
    singleConditionSummary += ")";

    return singleConditionSummary;


}