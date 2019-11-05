import {
    IBiomarkerModuleConditions, IBiomarkerCondition,
    IBioNumericInterface, IBioTextInterface,
    IQueryBuilderResponse
} from "../interface/index";
import { constants } from '../config/constants'

let normalConditionViewAlias = 'bio_t1';
let latestConditionViewAlias = 'bio_t2';
let textConditionViewAlias = 'bio_text';
let latestTextConditionViewAlias = 'bio_l_text';

let bioMarkerTable = function () {
    return `"${constants.database()}".biomarkers_cta`;
};
//INITIALLY IT WAS biomarker_text
let bioMarkerTextTable = function () {
    return `"${constants.database()}".biomarkers_text_cta`;
};



export async function getQueryForBiomerkers(condtions: IBiomarkerModuleConditions, dbname):
    Promise<IQueryBuilderResponse> {
    let baseQuery = ``;
    let responseObject: IQueryBuilderResponse = {
        query: '',
        alias: [],
        aliasCond: []
    };
    if (condtions.normal) {

        console.log("IN NORMAL QUERY ================");
        let normalConditionQuery = await getQueryForNormalCondition(condtions.normal, dbname);
        responseObject['alias'].push(normalConditionViewAlias);
        //changes made to handle inter-operability between latest and historical condition
        let aliasCondition = " INTERSECT";
        responseObject['aliasCond'].push(aliasCondition);
        baseQuery += ',' + normalConditionQuery;
        baseQuery = cleanUpQuery(baseQuery);

    }
    if (condtions.latest) {
        let latestConditionQuery = await getQueryForLatestCondition(condtions.latest, dbname);
        responseObject['alias'].push(latestConditionViewAlias);
        //changes made to handle inter-operability between latest and historical condition
        responseObject['aliasCond'].push(getAliasCondtionForLatest(condtions.normal, condtions.latest, " INTERSECT"));
        baseQuery += ',' + latestConditionQuery;
        baseQuery = cleanUpQuery(baseQuery);
    }
    //ADDED TEXTUAL SUPPORT to handle text based quries on biomarker schema
    //TODO: may be in next versions it can be moved out in seperate handler
    if (condtions.text) {
        let textConditionQuery = await getQueryForTextCondition(condtions.text, dbname);
        responseObject['alias'].push(textConditionViewAlias);
        //changes made to handle inter-operability between latest and historical condition
        responseObject['aliasCond'].push(" INTERSECT");
        baseQuery += ',' + textConditionQuery;
        baseQuery = cleanUpQuery(baseQuery);
    }
    if (condtions.textlatest) {
        let latestTextConditionQuery = await getQueryForTextLatestCondition(condtions.textlatest, dbname);
        responseObject['alias'].push(latestTextConditionViewAlias);
        //changes made to handle inter-operability between latest and historical condition
        responseObject['aliasCond'].push(getAliasCondtionForLatest(condtions.text, condtions.textlatest, " INTERSECT"));
        baseQuery += ',' + latestTextConditionQuery;
        baseQuery = cleanUpQuery(baseQuery);
    }


    responseObject.query = baseQuery;
    return responseObject;

}



export async function getQueryForNumericBiomerkers(condtions: IBioNumericInterface, dbname):
    Promise<IQueryBuilderResponse> {
    let baseQuery = ``;
    let responseObject: IQueryBuilderResponse = {
        query: '',
        alias: [],
        aliasCond: []
    };
    //IF query is intended for numeric biomarker
    //SEGMENT 1
    //if (condtions.bionumeric) {

    let aliasCondition = (condtions.compcondition == 'OR') ? " UNION" : " INTERSECT";
    //console.log("------------------> ",JSON.stringify(condtions),"  ==========");
    if (condtions.normal && condtions.normal.length > 0) {
        //let normalConditionQuery = await getQueryForNormalCondition(condtions.normal, dbname);
        let normalConditionQuery = await getQueryForNormalConditionNew(condtions.normal, dbname);

        responseObject['alias'].push(normalConditionViewAlias);
        //changes made to handle inter-operability between latest and historical condition
        responseObject['aliasCond'].push(aliasCondition);
        baseQuery += ',' + normalConditionQuery;
        baseQuery = cleanUpQuery(baseQuery);

    }
    if (condtions.latest && condtions.latest.length > 0) {
        let latestConditionQuery = await getQueryForLatestCondition(condtions.latest, dbname);
        responseObject['alias'].push(latestConditionViewAlias);
        //changes made to handle inter-operability between latest and historical condition
        responseObject['aliasCond'].push(getAliasCondtionForLatest(condtions.normal, condtions.latest, aliasCondition));
        baseQuery += ',' + latestConditionQuery;
        baseQuery = cleanUpQuery(baseQuery);
    }
    //}



    responseObject.query = baseQuery;
    return responseObject;

}

export async function getQueryForTextBiomerkers(condtions: IBioTextInterface, dbname):
    Promise<IQueryBuilderResponse> {
    let baseQuery = ``;
    let responseObject: IQueryBuilderResponse = {
        query: '',
        alias: [],
        aliasCond: []
    };

    //SEGMENT 2
    //IF query is intended for textual biomarker conditions
    // if (condtions.biotext) {
    //ADDED TEXTUAL SUPPORT to handle text based quries on biomarker schema
    //TODO: may be in next versions it can be moved out in seperate handler
    let aliasCondition = (condtions.compcondition == 'OR') ? " UNION" : " INTERSECT";
    if (condtions.text && condtions.text.length > 0) {
        let textConditionQuery = await getQueryForTextCondition(condtions.text, dbname);
        responseObject['alias'].push(textConditionViewAlias);
        //changes made to handle inter-operability between latest and historical condition
        responseObject['aliasCond'].push(aliasCondition);
        baseQuery += ',' + textConditionQuery;
        baseQuery = cleanUpQuery(baseQuery);
    }
    if (condtions.textlatest && condtions.textlatest.length > 0) {
        let latestTextConditionQuery = await getQueryForTextLatestCondition(condtions.textlatest, dbname);
        responseObject['alias'].push(latestTextConditionViewAlias);
        //changes made to handle inter-operability between latest and historical condition
        responseObject['aliasCond'].push(getAliasCondtionForLatest(condtions.text, condtions.textlatest, aliasCondition));
        baseQuery += ',' + latestTextConditionQuery;
        baseQuery = cleanUpQuery(baseQuery);
    }
    // }


    responseObject.query = baseQuery;
    return responseObject;

}


function getAliasCondtionForLatest(normalAvaliable, latestConditions: IBiomarkerCondition[], aliasCond: string) {
    //let aliasCondition = " INTERSECT";
    let aliasCondition = aliasCond;

    if (normalAvaliable && latestConditions) {

        var condCount = 0;
        // for (var alias in allAlias) {
        for (condCount = 0; condCount < latestConditions.length; ++condCount) {
            let cond = latestConditions[condCount];
            if (cond.dbCond.toUpperCase() == "OR") {
                aliasCondition = ' UNION';
            }
            else if (cond.dbCond.toUpperCase() == 'AND') {
                aliasCondition = ' INTERSECT';
                continue;
            }

        }

    }
    return aliasCondition;
}

function cleanUpQuery(query) {
    // first value is comma
    // console.log("query.indexOf(',')==================>>>>> ",query.indexOf(','))
    if (query.indexOf(',') == 0)
        query = query.replace(',', '');

    return query;
}

async function getQueryForNormalCondition(normalConditions: IBiomarkerCondition[], dbName) {

    let bioMarkersWhereConditions = '';
    let exclusionBioMarkersWhereConditions = '';

    for (var counter in normalConditions) {
        let condition = normalConditions[counter];

        let currentWhereClause = await getWhereClauseExtensionForCondition(condition, parseInt(counter));
        if (condition.scope == 'exclude') {
            exclusionBioMarkersWhereConditions += currentWhereClause;
        }
        else {
            bioMarkersWhereConditions += currentWhereClause;
        }

        //*************************OLDER CODE BASED ON CTA*************************************** */
        //let includeExcludeMarker = condition.scope == 'exclude' ? 'NOT' : '';
        // let OR_AND_OP = (counter == 0) ? '' : condition.dbCond;
        // if (condition.condition == 'bt') {
        //     bioMarkersWhereConditions += ` ${OR_AND_OP} ${includeExcludeMarker}(biomarkercode = '${condition.biomarkercode}' and (valued > ${condition.value1} and valued < ${condition.value2}))`
        // }
        // else if (condition.condition == 'da') {
        //     bioMarkersWhereConditions += ` ${OR_AND_OP} ${includeExcludeMarker}(biomarkercode = '${condition.biomarkercode}' and bookingdate >= timestamp '${condition.value}')`
        // }
        // else if (condition.condition == 'nda') {
        //     bioMarkersWhereConditions += ` ${OR_AND_OP} ${includeExcludeMarker}(biomarkercode = '${condition.biomarkercode}' and bookingdate =< timestamp '${condition.value}')`
        // }
        // else
        //     bioMarkersWhereConditions += ` ${OR_AND_OP} ${includeExcludeMarker}(biomarkercode = '${condition.biomarkercode}' and valued ${condition.condition} ${condition.value})`
        //**************************************************************** */
    }

    let exceptClause = '';
    if (exclusionBioMarkersWhereConditions.length > 1) {
        exceptClause = `EXCEPT
        select patientid from ${bioMarkerTable()}
        where labname = '${dbName}' ${exclusionBioMarkersWhereConditions}`
    }

    let normalQuery = `${normalConditionViewAlias} AS (select patientid from ${bioMarkerTable()} 
    where labname = '${dbName}' 
    ${bioMarkersWhereConditions}
    ${exceptClause}
    )`

    return normalQuery;

}



async function getQueryForNormalConditionNew(normalConditions: IBiomarkerCondition[], dbName) {

    let includeCompleteBaseQuery = `select distinct patientid from ${bioMarkerTable()} 
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
            includeCompleteBaseQuery += `${u_i_cond} select distinct patientid from ${bioMarkerTable()} 
            where labname = '${dbName}' ${currentWhereClause}`;
            includeCounter++;
        }
        else if (condition.scope == 'exclude') {
            let u_i_cond = (condition.dbCond == 'AND') ? ' INTERSECT' : ' UNION';
            if (excludeCounter == 0) {
                u_i_cond = ''
            }
            excludeCompleteBaseQuery += `${u_i_cond} select distinct patientid from ${bioMarkerTable()} 
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


async function getQueryForTextCondition(normalConditions: IBiomarkerCondition[], dbName) {

    let bioMarkersWhereConditions = '';
    let exclusionBioMarkersWhereConditions = '';


    for (var counter in normalConditions) {
        let condition = normalConditions[counter];

        let currentWhereClause = await getWhereClauseExtensionForCondition(condition, parseInt(counter));
        if (condition.scope == 'exclude') {
            exclusionBioMarkersWhereConditions += currentWhereClause;
        }
        else {
            bioMarkersWhereConditions += currentWhereClause;
        }

    }
    //TODO : patientremoteid should be homegenous across all QB as of now biomarker text is using patientremoteid
    //and others are using patientid as alias of patientremoteid
    let exceptClause = '';
    if (exclusionBioMarkersWhereConditions.length > 1) {
        exceptClause = `EXCEPT
        select patientremoteid as patientid from ${bioMarkerTextTable()}
        where labname = '${dbName}' ${exclusionBioMarkersWhereConditions}`
    }

    let normalQuery = `${textConditionViewAlias} AS (select patientremoteid as patientid from ${bioMarkerTextTable()} 
    where labname = '${dbName}' 
    ${bioMarkersWhereConditions}
    ${exceptClause}
    )`

    return normalQuery;

}


async function getWhereClauseExtensionForCondition(condition: IBiomarkerCondition, counter: number) {
    let bioMarkersWhereConditions = '';
    let OR_AND_OP = counter == 0 ? 'AND' : condition.dbCond;
    if (condition.condition == 'bt') {
        bioMarkersWhereConditions += ` ${OR_AND_OP} (biomarkercode = '${condition.biomarkercode}' and (valued > ${condition.value1} and valued < ${condition.value2}))`
    }
    else if (condition.condition == 'da') {
        bioMarkersWhereConditions += ` ${OR_AND_OP} (biomarkercode = '${condition.biomarkercode}' and bookingdate >= timestamp '${condition.value}')`
    }
    else if (condition.condition == 'nda') {
        bioMarkersWhereConditions += ` ${OR_AND_OP} (biomarkercode = '${condition.biomarkercode}' and bookingdate <= timestamp '${condition.value}')`
    }
    //exists condition
    else if (condition.condition == 'ex') {
        bioMarkersWhereConditions += ` ${OR_AND_OP} (biomarkercode = '${condition.biomarkercode}')`
    }
    else if (condition.condition == 'ext') {
        if (condition.biomarkermetaid) {
            bioMarkersWhereConditions += ` ${OR_AND_OP} (code = '${condition.biomarkermetaid}')`
        }
        else if (condition.testname) {
            bioMarkersWhereConditions += ` ${OR_AND_OP} (testname = '${condition.testname}')`
        }
    }
    //condition for text based biomarkers
    else if (condition.condition == 'contains') {
        bioMarkersWhereConditions += ` ${OR_AND_OP} (code = '${condition.biomarkermetaid}' and regexp_like(lower(result), lower('${condition.text}')))`
    }
    else
        bioMarkersWhereConditions += ` ${OR_AND_OP} (biomarkercode = '${condition.biomarkercode}' and valued ${condition.condition} ${condition.value})`

    return bioMarkersWhereConditions;

}


async function getWhereClauseExtensionForConditionNew(condition: IBiomarkerCondition, counter: number, labName : string) {
    let bioMarkersWhereConditions = '';
    //let OR_AND_OP = counter == 0 ? 'AND' : condition.dbCond;
    let OR_AND_OP = 'AND';
    if (condition.condition == 'bt') {
        bioMarkersWhereConditions += ` ${OR_AND_OP} (biomarkercode = '${condition.biomarkercode}' and (valued > ${condition.value1} and valued < ${condition.value2}))`
    }
    else if (condition.condition == 'da') {
        bioMarkersWhereConditions += ` ${OR_AND_OP} (biomarkercode = '${condition.biomarkercode}' and bookingdate >= timestamp '${condition.value}')`
    }
    //Changed after observation
    else if (condition.condition == 'nda') {
        //bioMarkersWhereConditions += ` ${OR_AND_OP} (biomarkercode = '${condition.biomarkercode}' and NOT(bookingdate > timestamp '${condition.value}'))`
        bioMarkersWhereConditions += ` ${OR_AND_OP} (biomarkercode = '${condition.biomarkercode}' and 
        patientid IN(
            select patientid from
            (
                                 select patientid,max(bookingdate) as maxbookingdate 
                                 FROM ${bioMarkerTable()}  
                                 where labname = '${labName}' 
                                 and biomarkercode = '${condition.biomarkercode}'                                
                                 GROUP BY patientid
                
             )
             where maxbookingdate <= timestamp '${condition.value}'
             )
             
        )`
    }
    //exists condition
    else if (condition.condition == 'ex') {
        bioMarkersWhereConditions += ` ${OR_AND_OP} (biomarkercode = '${condition.biomarkercode}')`
    }
    else if (condition.condition == 'ext') {
        if (condition.biomarkermetaid) {
            bioMarkersWhereConditions += ` ${OR_AND_OP} (code = '${condition.biomarkermetaid}')`
        }
        else if (condition.testname) {
            bioMarkersWhereConditions += ` ${OR_AND_OP} (testname = '${condition.testname}')`
        }
    }
    //condition for text based biomarkers
    else if (condition.condition == 'contains') {
        bioMarkersWhereConditions += ` ${OR_AND_OP} (code = '${condition.biomarkermetaid}' and regexp_like(lower(result), lower('${condition.text}')))`
    }
    else
        bioMarkersWhereConditions += ` ${OR_AND_OP} (biomarkercode = '${condition.biomarkercode}' and valued ${condition.condition} ${condition.value})`

    return bioMarkersWhereConditions;

}

async function getQueryForLatestCondition(latetsConditions: IBiomarkerCondition[], dbName) {
    let bioMarkersWhereConditions = '';
    let bioMarkersWhere = '';
    let includeCompleteBaseQuery = `select distinct patientid from ${latestConditionViewAlias}_interim
     `;
    let excludeCompleteBaseQuery = '';
    let includeCounter = 0;
    let excludeCounter = 0;
    for (var counter in latetsConditions) {

        let condition = latetsConditions[counter];
        //let OR_AND_OP = (parseInt(counter) == 0) ? '' : condition.dbCond;
        //==========================================================================
        //changes made to create generic set of all possible biomrakers used in query
        let OR_AND_OP = (parseInt(counter) == 0) ? '' : "OR";
        bioMarkersWhere += `${OR_AND_OP} biomarkercode = '${condition.biomarkercode}' `;

        //==========================================================================
        OR_AND_OP = (parseInt(counter) == 0) ? '' : "";
        let includeExcludeMarker = condition.scope == 'exclude' ? 'NOT' : '';
        if (condition.condition == 'bt') {
            bioMarkersWhereConditions = ` ${OR_AND_OP} ${includeExcludeMarker}(biomarkercode = '${condition.biomarkercode}' and (latest_val > ${condition.value1} and latest_val < ${condition.value2}))`
        }
        else
            bioMarkersWhereConditions = ` ${OR_AND_OP} ${includeExcludeMarker}(biomarkercode = '${condition.biomarkercode}' and latest_val ${condition.condition} ${condition.value})`


        if (condition.scope == 'include') {
            let u_i_cond = (condition.dbCond == 'AND') ? ' INTERSECT' : ' UNION';
            if (includeCounter == 0) {
                u_i_cond = ' INTERSECT'
            }
            includeCompleteBaseQuery += ` ${u_i_cond} select distinct patientid from ${latestConditionViewAlias}_interim 
                where 
                ${bioMarkersWhereConditions}`;
            includeCounter++;
        }
        else if (condition.scope == 'exclude') {
            let u_i_cond = (condition.dbCond == 'AND') ? ' INTERSECT' : ' UNION';
            if (excludeCounter == 0) {
                u_i_cond = ''
            }
            excludeCompleteBaseQuery += ` ${u_i_cond} select distinct patientid from ${latestConditionViewAlias}_interim 
                 where
                ${bioMarkersWhereConditions}`;
            excludeCounter++;
        }
    }


    //====================================================================
    let exceptClause = '';
    if (excludeCounter > 0) {
        exceptClause = `EXCEPT 
        (
        ${excludeCompleteBaseQuery}
        )`
    }
    //====================================================================

    let latestConditionQuery = `${latestConditionViewAlias}_interim AS (
        select patientid,biomarkercode,latest_val from
        (   SELECT 
            patientid,
            biomarkercode,
            bookingdate,
            valued AS latest_val
        from 
        (   SELECT * from
            (
            SELECT
            patientid,
            biomarkercode,
            bookingdate,
            valued,
            row_number() OVER (partition by patientid,biomarkercode ORDER BY bookingdate desc,valued desc) AS row_num
            from ${bioMarkerTable()} where labname = '${dbName}' and ${bioMarkersWhere}
            )
            where row_num = 1
            ) as b1
        ) as k
        group by patientid,biomarkercode,latest_val 
        order by patientid),
        ${latestConditionViewAlias} as(
            
            ${includeCompleteBaseQuery}   
            ${exceptClause}

        )
        `

    return latestConditionQuery;

}


async function getQueryForTextLatestCondition(latetsConditions: IBiomarkerCondition[], dbName) {
    let bioMarkersWhereConditions = '';
    let bioMarkersWhere = '';
    for (var counter in latetsConditions) {

        let condition = latetsConditions[counter];
        let OR_AND_OP = (parseInt(counter) == 0) ? '' : condition.dbCond;
        bioMarkersWhere += `${OR_AND_OP} code = '${condition.biomarkermetaid}' `;
        // let includeExcludeMarker = condition.scope == 'exclude' ? 'NOT' : '';
        if (condition.condition == 'contains') {
            bioMarkersWhereConditions += ` ${OR_AND_OP} (code = '${condition.biomarkermetaid}' and regexp_like(lower(latest_val), lower('${condition.text}')))`
        }
    }
    // biomarkermetaid is replaced by code
    let latestConditionQuery = `${latestTextConditionViewAlias} AS (
        select patientid,code,latest_val from
        (
        select b1.patientid,b1.code,b1.resultdate,
        first_value(b1.result)
        over(partition by b1.patientid,b1.code
        order by b1.resultdate desc) as latest_val
        from 
        (select patientremoteid as patientid,code,resultdate,result from ${bioMarkerTextTable()} where labname = '${dbName}' and ${bioMarkersWhere}) as b1
        ) as k
        where 
        ${bioMarkersWhereConditions}
        group by patientid,code,latest_val 
        order by patientid)`

    return latestConditionQuery;

}


export async function getQueryForBioMarkerMap(bioMapAlias: string, bioCodes: string[],
    finalViewAlias: string, dbName: string) {
    let quotedbioCodesCommaSeparated = "'" + bioCodes.join("','") + "'";
    let bioMapQuery = `${bioMapAlias} AS 
    (SELECT patientid,
         multimap_agg(biomarkercode,
         bookingdate) AS biomarker_dates,
         multimap_agg(biomarkercode,
         valued) AS biomarker_values
    FROM 
        (SELECT 
         patientid,
         biomarkermetaid,
         biomarkercode,
        bookingdate,
     valued
        
        FROM 
         (
         SELECT 
         patientid,
         biomarkermetaid,
         biomarkercode,
         bookingdate,
         valued,
         row_number()
                OVER (partition by patientid, biomarkercode
            ORDER BY  bookingdate desc) AS row_num
            FROM ${bioMarkerTable()}
            WHERE labname ='${dbName}'
                    AND biomarkercode IN(${quotedbioCodesCommaSeparated})
                    AND patientid IN 
                (SELECT patientid
                FROM ${finalViewAlias}) ) AS tmp
                WHERE row_num < 3
                GROUP BY  1, 2, 3,4,5 )
                GROUP BY  patientid  `


    return bioMapQuery;

}

