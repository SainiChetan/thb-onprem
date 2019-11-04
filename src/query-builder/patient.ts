import { IPatientCondition, IQueryBuilderResponse, IPatientModuleConditions } from '../interface/index'

let normalConditionViewAlias = 'patient_t1';


import { constants } from '../config/constants'

let patient_info_table = "patient_summary_info_cta";


export async function getQueryForPatient(condtions: IPatientModuleConditions, dbname):
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
async function getQueryForNormalCondition(normalConditions: IPatientCondition[], dbName) {
    let exclusionWhereConditions = '';
    let inclusionWhereCondition = '';

    for (var counter in normalConditions) {
        let currentCondition: IPatientCondition = normalConditions[counter];
        //changed to reduce global search
        currentCondition.dbCond = (parseInt(counter) == 0) ? 'AND' : currentCondition.dbCond;

        if (currentCondition.scope == 'exclude') {
            exclusionWhereConditions += getWhereConditionBasedOnFactor(currentCondition);
        }
        else {
            inclusionWhereCondition += getWhereConditionBasedOnFactor(currentCondition);
        }
        //baseQuery += getWhereConditionBasedOnFactor(currentCondition);

    }

    let exceptClause = '';
    if (exclusionWhereConditions.length > 1) {
        exceptClause = `EXCEPT
        select patientid from "${constants.database()}".${patient_info_table} where 
        labname = '${dbName}' ${exclusionWhereConditions}`
    }
    let baseQuery = `${normalConditionViewAlias} as 
    (select patientid from "${constants.database()}".${patient_info_table} where 
        labname = '${dbName}' ${inclusionWhereCondition}
     ${exceptClause}
     )`;
    // baseQuery += ')';

    return baseQuery;
}

//'visittype' | 'visitcount' | 'lastvisitdate' | 'center'
function getWhereConditionBasedOnFactor(condition: IPatientCondition) {
    let whereClause = '';
    let includeExcludeMarker = '';//condition.scope == 'exclude' ? 'NOT' : '';
    switch (condition.factor) {
        case 'age':
            if (condition.condition == 'bt') {
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(age >= ${condition.value1} and age <= ${condition.value2})`
            }
            else
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}( age ${condition.condition} ${condition.value})`

            break;
        case 'gender':
            //whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(gender = ${condition.value})`;
            whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(gender = '${condition.value}')`;
            break;
        case 'visittype':
            whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(visittype = '${condition.value}')`;
            break;
        case 'visitcount':
            whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(visit_count ${condition.condition} ${condition.value})`;
            break;
        case 'lastvisitdate':
            if (condition.condition == 'bt') {
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(lastvisitdate >= timestamp '${condition.value1}' and lastvisitdate <= timestamp '${condition.value2}')`
            }
            else
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}( lastvisitdate ${condition.condition} timestamp '${condition.value}')`

            break;
        case 'joiningdate':
            if (condition.condition == 'bt') {
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(joiningdate >= timestamp '${condition.value1}' and joiningdate <= timestamp '${condition.value2}')`
            }
            else
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}( joiningdate ${condition.condition} timestamp '${condition.value}')`

            break;
        case 'winback':
            if (condition.value)
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(lastvisitdate <= date_add('month', ${condition.value}, now()))`;
            break;
        case 'lcenter':
            if (condition.value)
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(lastcenterid IN (${condition.value.toString()}))`;
            break;
        case 'center':
            if (condition.value) {
                let whrARRAYCondition = getQueryForEverVisitedCenter(condition.value);
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(${whrARRAYCondition})`;
            }
            break;
        case 'channel':
            if (condition.value) {
                let whrARRAYCondition = getQueryForLastVisitedChannel(condition.value);
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(${whrARRAYCondition})`;
            }
            break;
        //supported for hospitals
        case 'patienttype':
            whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(patienttype = '${condition.value}')`;
            break;
        case 'novc':
            whereClause += ` ${condition.dbCond} ${includeExcludeMarker}( cardinality(all_visited_center) ${condition.condition} ${condition.value})`;
            break;
        case 'addr':
            whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(regexp_like(lower(address), '${condition.value}'))`;
            break;
        case 'all':
            whereClause += ``;
            break;

    }
    return whereClause;
}


function getQueryForEverVisitedCenter(valueArray: string[]) {

    let centerQuery = '';
    //console.log(valueArray.toString());
    for (var counter in valueArray) {
        if(parseInt(counter) == 0)
            centerQuery += `array_position(all_visited_center,${valueArray[counter]}) > 0`;
        else
            centerQuery += ` OR array_position(all_visited_center,${valueArray[counter]}) > 0`;
        // }
    }

    return centerQuery;
}


function getQueryForLastVisitedChannel(valueArray: string[]) {

    let channelQuery = '';
    for (var counter in valueArray) {
        if(parseInt(counter) == 0)
            channelQuery += `channel = '${valueArray[counter]}'`;
        else
            channelQuery += ` OR channel = '${valueArray[counter]}'`;
    }
    return channelQuery;
} 