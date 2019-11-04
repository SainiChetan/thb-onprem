import { ICommCondition, ICommConditions, IQueryBuilderResponse, IMessageInterface } from '../interface/index'

import { constants } from '../config/constants'

let normalConditionViewAlias = constants.commIncludeConditionViewAlias;
let excludeConditionViewAlias = constants.commExcludeConditionViewAlias;
let connect_table = "pep_historical_cleaned_data";
let patients_pii_table = 'patients_pii';
let patient_leads_info_table = "sync_clean_leads";


let query = `select count(DISTINCT(patientremoteid)) from
(
select patientremoteid,createddate from "poc"."comm_connect_sms_logs"
where dbname = 'suburbandb2' and 
month IN('11','12') and year IN('2018','2019')
)
where 
NOT(createddate >= timestamp '2018-12-15')`


export async function getQueryForConnect(condtions: ICommConditions, dbname):
    Promise<IQueryBuilderResponse> {
    let baseQuery = '';
    let responseObject: IQueryBuilderResponse = {
        query: '',
        alias: [],
        aliasCond: []
    };
    if (condtions.normal) {
        let commResponse = await getQueryForNormalCondition(condtions.normal, dbname);
        baseQuery += commResponse.query;

        if (commResponse.exclusionBlock) {
            responseObject['alias'].push(excludeConditionViewAlias);
        }
        if (commResponse.inclusionBlock) {
            responseObject['alias'].push(normalConditionViewAlias);
        }
    }
    //changes made to support UNION/INTERSECT across components
    let aliasCondition = (condtions.compcondition == 'OR') ? " UNION" : " INTERSECT";
    responseObject['aliasCond'].push(aliasCondition);
    responseObject.query = baseQuery;
    return responseObject;

}

function getAdequatePartitionsForQuery(): {
    yearPartions: string,
    monthParitions: string
} {
    let currentDate = new Date();
    let currentYear = currentDate.getFullYear();
    let currentMonth = currentDate.getMonth() + 1;
    let totalPartition = 6;
    //to load last 6 partitions
    let monthPartitions: number[] = [];
    let yearPartitions: number[] = [];
    monthPartitions.push(currentMonth);
    yearPartitions.push(currentYear);
    let shouldIncludeLastYear: boolean = false;
    for (var i = 0; i < totalPartition; i++) {
        let currentMonthPartition = currentMonth - (i + 1);
        if (currentMonthPartition < 0) {
            currentMonthPartition = 12 + currentMonthPartition;
            shouldIncludeLastYear = true;
        }
        monthPartitions.push(currentMonthPartition);
    }
    if (shouldIncludeLastYear) {
        yearPartitions.push(currentYear - 1);
    }
    let quotedyearPartitions = yearPartitions.join(',');//"'" + yearPartitions.join("','") + "'";
    let quotedmonthPartitions = monthPartitions.join(',');//"'" + monthPartitions.join("','") + "'";
    return { yearPartions: quotedyearPartitions, monthParitions: quotedmonthPartitions }
}

async function getQueryForNormalCondition(normalConditions: ICommCondition[], dbName):
    Promise<
    {
        "query": string,
        "exclusionBlock": boolean,
        "inclusionBlock": boolean
    }> {
    let response = { "query": "", "exclusionBlock": false, "inclusionBlock": false };
    let includeWhereBlock = '';
    let exceptWhereBlock = '';
    for (var counter in normalConditions) {
        let currentCondition: ICommCondition = normalConditions[counter];
        if (currentCondition.scope == 'exclude') {
            exceptWhereBlock += getWhereConditionBasedOnFactor(currentCondition);
        }
        else {
            includeWhereBlock += getWhereConditionBasedOnFactor(currentCondition);
        }

    }

    //loading adequate partitions
    let partitionsMap = getAdequatePartitionsForQuery();
    let baseQuery = `connect_t1 as (
            select b.remoteid as patientid, a.dispatchdate, a.createddate  from ( 
            (
            select patientid ,dispatchdate,createddate,mobile from "${constants.live_comm_database()}"."${connect_table}" where 
            labname = '${dbName}' and 
            month IN(${partitionsMap.monthParitions}) and year IN(${partitionsMap.yearPartions})
            ) a
            INNER JOIN 
            ( 
            select mobile,remoteid from "${constants.database()}"."patients_pii"
            where labname = '${dbName}'
            ) b
            on 
            a.mobile = b.mobile
            )
        
        )
        `;

    if (includeWhereBlock.length > 1) {
        response.inclusionBlock = true;
        baseQuery = `${baseQuery}
        ,${normalConditionViewAlias} as
        (
            select DISTINCT(patientid) from connect_t1 where 1=1
            ${includeWhereBlock}
        )`
    }
    if (exceptWhereBlock.length > 1) {
        response.exclusionBlock = true;
        baseQuery = `${baseQuery}
        ,${excludeConditionViewAlias} as
        (
            select DISTINCT(patientid) from connect_t1 where 1=1
            ${exceptWhereBlock}
        )`
    }
    response.query = baseQuery;
    console.log("response==============>>>", response.inclusionBlock, response.exclusionBlock);
    return response;
}



async function getQueryForNormalConditionNew(normalConditions: ICommCondition[], dbName) {

    let includeCompleteBaseQuery = `select distinct patientid from "${constants.live_comm_database()}"."${connect_table}"
    where labname = '${dbName}'`;
    let excludeCompleteBaseQuery = '';
    let excludeCounter = 0;
    let includeCounter = 0;
    for (var counter in normalConditions) {
        let condition = normalConditions[counter];

        let currentWhereClauseQuery = await getWhereConditionBasedOnFactorNew(condition, dbName);
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


function getWhereConditionBasedOnFactor(condition: ICommCondition) {
    let whereClause = '';
    //CHANGED AFTER INCLUSION OF EXCEPT BLOCK
    //let includeExcludeMarker = condition.scope == 'exclude' ? 'NOT' : '';
    let includeExcludeMarker = '';
    switch (condition.factor) {
        case 'createddate':
            if (condition.condition == '=') {
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}( cast(dispatchdate as date) ${condition.condition} cast('${condition.date}' as date))`
            }
            else {
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}( dispatchdate ${condition.condition} timestamp '${condition.date}')`
            }
            break;
        case 'campaign':
            //TODO
            // whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(gender = ${condition.value})`;
            break;

    }
    console.log("whereClause - ", whereClause);
    return whereClause;
}

function getWhereConditionBasedOnFactorNew(condition: ICommCondition, dbName: string) {
    let whereClause = '';
    //CHANGED AFTER INCLUSION OF EXCEPT BLOCK
    //let includeExcludeMarker = condition.scope == 'exclude' ? 'NOT' : '';
    let includeExcludeMarker = '';
    switch (condition.factor) {
        case 'createddate':
            if (condition.condition == '=') {
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}( cast(dispatchdate as date) ${condition.condition} cast('${condition.date}' as date))`
            }
            else {
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}( dispatchdate ${condition.condition} timestamp '${condition.date}')`
            }
            break;
        case 'campaign':
            //TODO
            // whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(gender = ${condition.value})`;
            break;

    }
    let currentWherCluaseQuery = `select distinct patientid from "${constants.live_comm_database()}"."${connect_table}"
    where labname = '${dbName}' ${whereClause}`;
    return currentWherCluaseQuery;

}
//This function handles specical characters provided by BT
function getTranformMessageForSpecialCharacters(orignalMsg: string) {
    let trandfromedMsg = orignalMsg.replace(/,/g, ",CHR(44),")
        .replace(/'/g, ",CHR(39),")
        .replace(/'/g, ",CHR(34),");
    let finalTrandformedMessage = trandfromedMsg.split(',').map(function (word) {
        if (word == 'CHR(39)' || word == 'CHR(44)' || word == 'CHR(34)')
            return word.trim();
        else
            return "'" + word.trim() + "'";
    }).join(',');
    return finalTrandformedMessage;

}

export async function getQueryBasedOnMessage(msgCondition: IMessageInterface | undefined, dbName: string, isPatientLeadsQuery: boolean,
    isDmrQuery: boolean,
    campaignName: string) {
    let finalViewCondition = '';
    let msgQuery = '';

    //MASKING OF MOBILE INFO
    if (msgCondition) {
        let greetings = msgCondition.greetings ? msgCondition.greetings : '';
        let includeGreetings = msgCondition.includeGreeting ? msgCondition.includeGreeting : false;
        let greetingsFactor = msgCondition.greetingsFactor ? msgCondition.greetingsFactor : '';
        let message = getTranformMessageForSpecialCharacters(msgCondition.message);
        msgQuery = `concat('',${message}) as msg `;
        //changes for special character handling '${message}' ===> ${message}
        //SUPRESSED AS WE ARE FETCHING THESE SALUTATION SETTINGS FROM centric lab settings
        if (includeGreetings) {
            if (greetingsFactor == 'fullname') {
                msgQuery = `concat('${greetings}','',' ',upper(name),', ',${message}) as msg`;
            }
            else if (greetingsFactor == 'firstname') {
                msgQuery = `concat('${greetings}','',' ',upper(split_part(name,' ',1)),', ',${message}) as msg`;
            }
            else if (greetingsFactor == 'none') {
                msgQuery = `concat('${greetings}',' ','',',',${message}) as msg`;
            }

        }
    }

    if (isPatientLeadsQuery) {
        if (msgQuery) {
            finalViewCondition = `(
                SELECT remoteid as mid, p1.patientid as labpatientid,'-' as centreid,'-' as bookingid,
                    p1.name,
                    mobile,p1.email,
                    current_date as camdate,p1.labname,${msgQuery},
                    concat(mobile,'_',cast(to_unixtime(now()) as varchar(20)),'_','PL') as uniqueid,
                    is_valid_mobile as hasvalidmobile,
                    is_valid_email as hasvalidemail,
                    '${campaignName}' as campaignname 
                    FROM "${constants.patientLeadsDatabase}"."${constants.getpatientLeadsTableCorrespondingToEnv()}" as p1
                    WHERE labname = '${dbName}'
                    GROUP BY 
                    -- 1,2,3,4,5,6,7,8
                    remoteid,  p1.patientid, p1.name, mobile,
                    p1.is_valid_mobile,p1.is_valid_email, p1.email, p1.labname
                ) as b
            `;
        } else {
            finalViewCondition = `(
                    SELECT remoteid as mid, p1.patientid as labpatientid,'-' as centreid,
                    '-' as channel,
                    '-' as bookingid,
                    p1.name,
                    mobile,p1.email,
                    current_date as camdate,p1.labname,'',
                    concat(mobile,'_',cast(to_unixtime(now()) as varchar(20)),'_','PL') as uniqueid,
                    is_valid_mobile as hasvalidmobile,
                    is_valid_email as hasvalidemail,
                    '${campaignName}' as campaignname 
                    FROM "${constants.patientLeadsDatabase}"."${constants.getpatientLeadsTableCorrespondingToEnv()}" as p1
                    WHERE labname = '${dbName}'
                    GROUP BY 
                    -- 1,2,3,4,5,6,7,8
                    remoteid,  p1.patientid, p1.name, mobile,
                    p1.is_valid_mobile,p1.is_valid_email, p1.email, p1.labname
                ) as b
            `;
        }

    }
    //================================ DMR SEGMENT ====================================
    else if (isDmrQuery) {
        if (msgQuery) {
            finalViewCondition = `(
                SELECT remoteid as mid, p1.doctorid as labpatientid,'-' as centreid,'-' as bookingid,
                    p1.name,
                    mobile,p1.email,
                    current_date as camdate,p1.labname,${msgQuery},
                    concat(mobile,'_',cast(to_unixtime(now()) as varchar(20)),'_','DMR') as uniqueid,
                    hasvalidmobile,
                    hasvalidemail,
                    '${campaignName}' as campaignname 
                    FROM "${constants.getdmrDBCorrespondingToEnv()}"."${constants.getdmrTableCorrespondingToEnv()}" as p1
                    WHERE labname = '${dbName}'
                    GROUP BY 
                    -- 1,2,3,4,5,6,7,8
                    remoteid,  p1.doctorid, p1.name, mobile,
                    p1.hasvalidmobile,p1.hasvalidemail, p1.email, p1.labname
                ) as b
            `;
        } else {
            finalViewCondition = `(
                    SELECT remoteid as mid, p1.doctorid as labpatientid,'-' as centreid,
                    '-' as channel,
                    '-' as bookingid,
                    p1.name,
                    mobile,p1.email,
                    current_date as camdate,p1.labname,'',
                    concat(mobile,'_',cast(to_unixtime(now()) as varchar(20)),'_','DMR') as uniqueid,
                    hasvalidmobile,
                    hasvalidemail,
                    '${campaignName}' as campaignname 
                    FROM "${constants.getdmrDBCorrespondingToEnv()}"."${constants.getdmrTableCorrespondingToEnv()}" as p1
                    WHERE labname = '${dbName}'
                    GROUP BY 
                    -- 1,2,3,4,5,6,7,8
                    remoteid,  p1.doctorid, p1.name, mobile,
                    p1.hasvalidmobile,p1.hasvalidemail, p1.email, p1.labname
                ) as b
            `;
        }

    }
    else {
        if (msgQuery) {
            finalViewCondition = `(SELECT remoteid as mid,patientid as labpatientid,centreid,channel,bookingid,name,
                mobile,email,
            current_date as camdate,labname,
            ${msgQuery},
            concat(mobile,'_',cast(to_unixtime(now()) as varchar(20)),'_','PC') as uniqueid,
            '${campaignName}' as campaignname,
            hasvalidmobile, hasvalidemail
            FROM "${constants.database()}"."${patients_pii_table}" where labname = '${dbName}' and (deceased IS NULL or deceased = false)) as b`;
        } else {
            finalViewCondition = `(SELECT remoteid as mid,patientid as labpatientid,centreid,channel,bookingid,name,
                mobile,email,
            current_date as camdate,labname,'',
            concat(mobile,'_',cast(to_unixtime(now()) as varchar(20)),'_','PC') as uniqueid,
            '${campaignName}' as campaignname,
            hasvalidmobile, hasvalidemail
            FROM "${constants.database()}"."${patients_pii_table}" where labname = '${dbName}' and (deceased IS NULL or deceased = false)) as b`;
        }
    }

    // concat('XXXXXX',substr(mobile,7,4)) as   mobile,email


    return finalViewCondition;

}


