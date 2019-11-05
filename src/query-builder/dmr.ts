import { IDMRCondition, IQueryBuilderResponse, IDmrModuleConditions } from '../interface/index'

// let normalConditionViewAlias = 'patient_t1';
let normalConditionViewAlias = 'dmr_t1';
import { constants } from '../config/constants';

let dmr_table = constants.getdmrTableCorrespondingToEnv();//"sync_clean_leads";


export async function getQueryForDMR(condtions: IDmrModuleConditions, dbname):
    Promise<IQueryBuilderResponse> {
    let baseQuery = '';
    let responseObject: IQueryBuilderResponse = {
        query: '',
        alias: [],
        aliasCond: []
    };
    if (condtions.normal && condtions.normal.length > 0) {
        baseQuery += await getQueryForNormalCondition(condtions.normal, dbname);
        responseObject['alias'].push(normalConditionViewAlias);
        let aliasCondition = (condtions.compcondition == 'OR') ? " UNION" : " INTERSECT";
        responseObject['aliasCond'].push(aliasCondition);
    }
    responseObject.query = baseQuery;
    return responseObject;

}

//explicit exclude condition in summary
async function getQueryForNormalCondition(normalConditions: IDMRCondition[], dbName) {
    let exclusionWhereConditions = '';
    let inclusionWhereCondition = '';

    for (var counter in normalConditions) {
        let currentCondition: IDMRCondition = normalConditions[counter];
        //changed to reduce global search
        currentCondition.dbCond = (parseInt(counter) == 0) ? 'AND' : currentCondition.dbCond;

        if (currentCondition.scope == 'exclude') {
            exclusionWhereConditions += getWhereConditionBasedOnFactor(currentCondition, dbName);
        }
        else {
            inclusionWhereCondition += getWhereConditionBasedOnFactor(currentCondition, dbName);
        }
    }

    let exceptClause = '';
    if (exclusionWhereConditions.length > 1) {
        exceptClause = `
            EXCEPT
            SELECT remoteid as patientid 
            FROM "${constants.getdmrDBCorrespondingToEnv()}".${constants.getdmrTableCorrespondingToEnv()} 
            WHERE 
                labname = '${dbName}' 
                ${exclusionWhereConditions}
        `
    }
    let baseQuery = `
        ${normalConditionViewAlias} as (
                SELECT remoteid as patientid 
                FROM "${constants.getdmrDBCorrespondingToEnv()}".${constants.getdmrTableCorrespondingToEnv()}
                WHERE 
                    labname = '${dbName}' 
                    ${inclusionWhereCondition}
                    ${exceptClause}
        )
    `;
    return baseQuery;
}

function getWhereConditionBasedOnFactor(condition: IDMRCondition, dbName: string) {
    let whereClause = '';
    let includeExcludeMarker = ''; //condition.scope == 'exclude' ? 'NOT' : '';
    if (condition.factor == "gender" && condition.value) {
        let values: string[] = [];
        if (!Array.isArray(condition.value)) {
            values.push(condition.value.toString());
        } else {
            values = condition.value;
        }
        if (values.indexOf("M") > -1) {
            values.push("male", "m");
        }
        if (values.indexOf("F") > -1) {
            values.push("female", "f");
        }
        if (values.indexOf("O") > -1) {
            values.push("others", "other", "o");
        }
        condition.value = values;
    }
    // if (condition.value && Array.isArray(condition.value)) {
    //     let str: string = '';
    //     condition.value.map((val, idx) => {
    //         str = idx != condition.value.length - 1 ? `${str} '${val}',` : `${str} '${val}'`;
    //     });
    //     condition.value = str;
    // } else {
    //     condition.value = `'${condition.value}'`
    // }
    switch (condition.factor) {
        case 'all':
            break;
        case 'age':
            if (condition.condition == 'bt') {
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(age >= ${condition.value1} and age <= ${condition.value2})`
            }
            else
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}( age ${condition.condition} ${condition.value})`
            break;
        case 'gender':
            whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(gender IN ('${condition.value}'))`;
            break;
        case 'channel':
            if (condition.value) {
                let whrARRAYCondition = getWhereClauseForMultiselectComponent(condition.value, 'channel');
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(${whrARRAYCondition})`;
            }
            break;
        case 'city':
            if (condition.value) {
                let whrARRAYCondition = getWhereClauseForMultiselectComponent(condition.value, 'city');
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(${whrARRAYCondition})`;
            }
            break;
        case 'specialization':
            if (condition.value) {
                let whrARRAYCondition = getWhereClauseForMultiselectComponent(condition.value, 'specialization');
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(${whrARRAYCondition})`;
            }
            break;
        case 'state':
            if (condition.value) {
                let whrARRAYCondition = getWhereClauseForMultiselectComponent(condition.value, 'state');
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(${whrARRAYCondition})`;
            }
            break;
        case 'doctorname':
            if (condition.value) {
                if (condition.condition == 'eq') {
                    whereClause += `lower(name) = lower('${condition.value.trim()}')`;
                }
                else if (condition.condition == 'contains') {
                    whereClause += ` regexp_like(lower(name), lower('${condition.value.trim()}'))`;
                }
            }
            break;
        case 'prescribertype':
            if (condition.value) {
                let whrARRAYCondition = getWhereClauseForMultiselectComponent(condition.value, 'prescriber_type');
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(${whrARRAYCondition})`;
            }
            break;
        case 'hospital':
            if (condition.value) {
                let whrARRAYCondition = getWhereClauseForMultiselectComponent(condition.value, 'hospital');
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(${whrARRAYCondition})`;
            }
            break;
        
        case 'custom1':
            whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(custom1 IN (${condition.value}))`;
            break;
        case 'custom2':
            whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(custom2 IN ('${condition.value}'))`;
            break;
        case 'emailcamp':
            let filterQueryForEmailCampaigns = getFilterConditionBasedOnCampaign(condition.value1,condition.value2,condition.factor,dbName);
            whereClause += ` ${condition.dbCond} ${includeExcludeMarker} (doctorid IN (${filterQueryForEmailCampaigns}))`;
            break;
        case 'smscamp':
            let filterQueryForSMSCampaigns = getFilterConditionBasedOnCampaign(condition.value1,condition.value2,condition.factor,dbName);
            whereClause += ` ${condition.dbCond} ${includeExcludeMarker} (doctorid IN (${filterQueryForSMSCampaigns}))`;
            break;

    }
    return whereClause;
};



function getWhereClauseForMultiselectComponent(valueArray: string[], factor: string) {

    let componentQuery = '';
    for (var counter in valueArray) {
        if (parseInt(counter) == 0)
            componentQuery += `${factor} = '${valueArray[counter]}'`;
        else
            componentQuery += ` OR ${factor} = '${valueArray[counter]}'`;
    }
    return componentQuery;
}


function getFilterConditionBasedOnCampaign(campaignArray,
    eventsArray, campaignType, dbName) {

    let componentQuery = '';
    let campaignSegment = '';
    if (campaignArray) {
        //================= campaign segment ===============================
        let readyTableBasedOnType = '';
        if (campaignType === 'emailcamp') {
            readyTableBasedOnType = 'thb_email_ready_comm_feeds';
        }
        else if (campaignType === 'smscamp') {
            readyTableBasedOnType = 'thb_sms_ready_comm_feeds';
        }
        else if (campaignType === 'whatscamp') {
        }

        campaignSegment = `SELECT distinct(patientid) as doctorid FROM 
                "${constants.live_comm_database()}".${readyTableBasedOnType} 
                where labname = '${dbName}' and
                ${getWhereClauseForMultiselectComponent(campaignArray, 'campid')} 
                and commtype='dmr'`

        //====================== Events Segment ===========================
        let eventsSegment = '';
        if (eventsArray) {
            eventsSegment = `SELECT distinct(userid) as doctorid FROM 
                            "${constants.getEventsDBCorrespondingToEnv()}".
                            ${constants.getEventsTableCorrespondingToEnv()} where 
                            labname = '${dbName}'
                            and
                            ${getWhereClauseForMultiselectComponent(campaignArray, 'cid')} 
                            and 
                            ${getWhereClauseForMultiselectComponent(eventsArray, 'action')}
                            UNION
                            SELECT distinct(patientid) as doctorid FROM 
                            "${constants.getEmailBasedEventsDBCorrespondingToEnv()}".
                            ${constants.getEmailBasedTableorrespondingToEnv()} where 
                            labname = '${dbName}' and commtype='dmr'
                            and
                            ${getWhereClauseForMultiselectComponent(campaignArray, 'campid')} 
                            and 
                            ${getWhereClauseForMultiselectComponent(eventsArray, 'status')}`


        }


        componentQuery = `select distinct(doctorid) from
                        (
                            ${campaignSegment}
                            INTERSECT
                            ${eventsSegment}
                        )`
    }
    return componentQuery
}

