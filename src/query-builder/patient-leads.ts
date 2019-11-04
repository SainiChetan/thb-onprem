import { IPatientLeadCondition, IQueryBuilderResponse, IPatientLeadsModuleConditions } from '../interface/index'

// let normalConditionViewAlias = 'patient_t1';
let normalConditionViewAlias = 'patient_leads_t1';
import { constants } from '../config/constants';

let patient_leads_info_table = constants.getpatientLeadsTableCorrespondingToEnv();//"sync_clean_leads";


export async function getQueryForPatientLeads(condtions: IPatientLeadsModuleConditions, dbname):
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
async function getQueryForNormalCondition(normalConditions: IPatientLeadCondition[], dbName) {
    let exclusionWhereConditions = '';
    let inclusionWhereCondition = '';

    for (var counter in normalConditions) {
        let currentCondition: IPatientLeadCondition = normalConditions[counter];
        //changed to reduce global search
        currentCondition.dbCond = (parseInt(counter) == 0) ? 'AND' : currentCondition.dbCond;

        if (currentCondition.scope == 'exclude') {
            exclusionWhereConditions += getWhereConditionBasedOnFactor(currentCondition,dbName);
        }
        else {
            inclusionWhereCondition += getWhereConditionBasedOnFactor(currentCondition,dbName);
        }
    }

    let exceptClause = '';
    if (exclusionWhereConditions.length > 1) {
        exceptClause = `
            EXCEPT
            SELECT patientid 
            FROM "${constants.patientLeadsDatabase}"."${constants.getpatientLeadsTableCorrespondingToEnv()}" 
            WHERE 
                labname = '${dbName}' 
                ${exclusionWhereConditions}
        `
    }
    let baseQuery = `
        ${normalConditionViewAlias} as (
                SELECT patientid 
                FROM "${constants.patientLeadsDatabase}"."${constants.getpatientLeadsTableCorrespondingToEnv()}"
                WHERE 
                    labname = '${dbName}' 
                    ${inclusionWhereCondition}
                    ${exceptClause}
        )
    `;
    return baseQuery;
}

function getWhereConditionBasedOnFactor(condition: IPatientLeadCondition,dbName: string) {
    let whereClause = '';
    let includeExcludeMarker = ''; //condition.scope == 'exclude' ? 'NOT' : '';
    if(condition.factor=="gender" && condition.value){
        let values:string[] = [];
        if(!Array.isArray(condition.value)){
            values.push(condition.value.toString());
        }else{
            values = condition.value;
        }
        if(values.indexOf("M")>-1){
            values.push("male", "m");
        }
        if(values.indexOf("F")>-1){
            values.push("female", "f");
        }
        if(values.indexOf("O")>-1){
            values.push("others", "other", "o");
        }
        condition.value = values;
    }
    if(condition.value && Array.isArray(condition.value)){
        let str:string = '';
        condition.value.map((val, idx)=>{
            str = idx!=condition.value.length-1 ? `${str} '${val}',` : `${str} '${val}'`;
        });
        condition.value = str;
    }else{
        condition.value = `'${condition.value}'`
    }
    switch (condition.factor) {
        case 'all':
            break;
        case 'age':
            if (condition.condition == 'bt') {
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(CAST(age as integer) >= ${condition.value1} and CAST(age as integer) <= ${condition.value2})`
            }
            else
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}( age ${condition.condition} ${condition.value})`
            break;
        case 'gender':
            whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(gender IN (${condition.value}))`;
            break;
        case 'channel':
            whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(channel IN (${condition.value}))`;
            break;
        case 'city':
            whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(city IN (${condition.value}))`;
            break;
        case 'joiningdate':
            if (condition.condition == 'bt') {
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(joiningdate >= timestamp '${condition.value1}' and joiningdate <= timestamp '${condition.value2}')`
            }
            else
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}( joiningdate ${condition.condition} timestamp '${condition.value}')`
        case 'returned':
            if (condition.condition == 'ev') {
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(mobile in(SELECT distinct mobile 
                    FROM "${constants.database()}".patients_pii
                    WHERE 
                    labname = '${dbName}'
                    ))`
            }
            else if (condition.condition == 'bt') {
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(mobile in(SELECT distinct mobile 
                    FROM "${constants.database()}".patients_pii
                    WHERE 
                    labname = '${dbName}'
                    and
                    lastvisitdate >= timestamp '${condition.value1}' and lastvisitdate <= timestamp '${condition.value2}'
                    ))`
            }
            else{
                whereClause += ` ${condition.dbCond} ${includeExcludeMarker}(mobile in(SELECT distinct mobile 
                    FROM "${constants.database()}".patients_pii
                    WHERE 
                    labname = '${dbName}'
                    and
                    lastvisitdate ${condition.condition} timestamp ${condition.value}
                    ))`
            }
            break;
    }
    return whereClause;
};   