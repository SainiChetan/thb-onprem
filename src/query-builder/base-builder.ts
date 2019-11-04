import {
    getQueryForBiomerkers, getQueryForNumericBiomerkers,
    getQueryForTextBiomerkers,
    getQueryForBioMarkerMap
} from './biomarkers'
import { getQueryForBilling } from './billing'
import { getQueryForPatient } from './patient'
import { getQueryForEmr } from './emr'
import {
    getQueryForPatientLeads
} from './patient-leads'
import { getQueryForDMR } from './dmr'
import { getQueryForConnect, getQueryBasedOnMessage } from './comm'
import { cleanUpQuery } from '../util/index'
import { IQueryConditions, IQueryBuilderResponse, IMessageInterface } from '../interface/index'
import { constants } from '../config/constants'

let finalViewAlias = 'master_final'
let bioMapAlias = 'biomap'

/**
 * 
 * @param condtionsMap 
 * generate complete query using the given conditions
 */
export async function getCompleteQuery(condtionsMap: IQueryConditions):
    Promise<any> {
    let allInterimAlias: any[] = [];
    let allInterimAliasConditions: any[] = [];
    let masterQuery = '';

    //console.log("BIOMARKERS------------->>",JSON.stringify(condtionsMap.biomarker));
    //IF biomarker consition is there
    if (condtionsMap.biomarker &&
        (condtionsMap.biomarker.latest
            || condtionsMap.biomarker.normal
            || condtionsMap.biomarker.text
            || condtionsMap.biomarker.textlatest)
    ) {

        let biomarkerQueryObject: IQueryBuilderResponse = await getQueryForBiomerkers(condtionsMap.biomarker, condtionsMap.dbname);
        //TODO: will be removed after first stable build,just rechecking the sanity
        if (biomarkerQueryObject.query.length > 1) {
            masterQuery += "," + biomarkerQueryObject.query;
            allInterimAlias.push(biomarkerQueryObject.alias);
            allInterimAliasConditions.push(biomarkerQueryObject.aliasCond);
        }
    }


    //CLAUSE ADDED TO HANDLE NUMERIC BIOMARKER BASED QURIES
    if (condtionsMap.biomarker && condtionsMap.biomarker.bionumeric) {
        console.log("================== iN NUMERIC BIOMARKER ====================");
        let biomarkerQueryObject: IQueryBuilderResponse = await getQueryForNumericBiomerkers(condtionsMap.biomarker.bionumeric, condtionsMap.dbname);
        //TODO: will be removed after first stable build,just rechecking the sanity
        if (biomarkerQueryObject.query.length > 1) {
            masterQuery += "," + biomarkerQueryObject.query;
            allInterimAlias.push(biomarkerQueryObject.alias);
            allInterimAliasConditions.push(biomarkerQueryObject.aliasCond);
        }
    }

    //CLAUSE ADDED TO HANDLE TEXT BIOMARKER BASED QURIES
    if (condtionsMap.biomarker && condtionsMap.biomarker.biotext) {

        let biomarkerQueryObject: IQueryBuilderResponse = await getQueryForTextBiomerkers(condtionsMap.biomarker.biotext, condtionsMap.dbname);
        //TODO: will be removed after first stable build,just rechecking the sanity
        if (biomarkerQueryObject.query.length > 1) {
            masterQuery += "," + biomarkerQueryObject.query;
            allInterimAlias.push(biomarkerQueryObject.alias);
            allInterimAliasConditions.push(biomarkerQueryObject.aliasCond);
        }
    }


    //if billing condition is there -- summary excluded
    if (condtionsMap.billing) {

        let billingQueryObject: IQueryBuilderResponse = await getQueryForBilling(condtionsMap.billing, condtionsMap.dbname);
        //TODO: will be removed after first stable build,just rechecking the sanity
        if (billingQueryObject.query.length > 1) {
            masterQuery += "," + billingQueryObject.query;
            allInterimAlias.push(billingQueryObject.alias);
            allInterimAliasConditions.push(billingQueryObject.aliasCond);
        }
    }

    //patient info
    if (condtionsMap.patient) {

        let patientQueryObject: IQueryBuilderResponse = await getQueryForPatient(condtionsMap.patient, condtionsMap.dbname);
        //console.log("patientQueryObject:------", JSON.stringify(patientQueryObject));
        //TODO: will be removed after first stable build,just rechecking the sanity
        if (patientQueryObject.query.length > 1) {
            masterQuery += "," + patientQueryObject.query;
            allInterimAlias.push(patientQueryObject.alias);
            allInterimAliasConditions.push(patientQueryObject.aliasCond);
        }
    }

    if (condtionsMap.patientleads) {
        let patientLeadsQueryObject: IQueryBuilderResponse = await getQueryForPatientLeads(condtionsMap.patientleads, condtionsMap.dbname);
        //console.log("patientLeadsQueryObject:------", JSON.stringify(patientLeadsQueryObject));
        //TODO: will be removed after first stable build,just rechecking the sanity
        if (patientLeadsQueryObject.query.length > 1) {
            masterQuery += "," + patientLeadsQueryObject.query;
            allInterimAlias.push(patientLeadsQueryObject.alias);
            allInterimAliasConditions.push(patientLeadsQueryObject.aliasCond);
        }
    }

    if (condtionsMap.emr) {
        let emrQueryObject: IQueryBuilderResponse = await getQueryForEmr(condtionsMap.emr, condtionsMap.dbname);
        //TODO: will be removed after first stable build,just rechecking the sanity
        if (emrQueryObject.query.length > 1) {
            masterQuery += "," + emrQueryObject.query;
            allInterimAlias.push(emrQueryObject.alias);
            allInterimAliasConditions.push(emrQueryObject.aliasCond);
        }
    }


    if (condtionsMap.dmr) {
        console.log("dmr obJEXT :::===",JSON.stringify(condtionsMap.dmr));
        let dmrQueryObject: IQueryBuilderResponse = await getQueryForDMR(condtionsMap.dmr, condtionsMap.dbname);
        //TODO: will be removed after first stable build,just rechecking the sanity
        if (dmrQueryObject.query.length > 1) {
            masterQuery += "," + dmrQueryObject.query;
            allInterimAlias.push(dmrQueryObject.alias);
            allInterimAliasConditions.push(dmrQueryObject.aliasCond);
        }
    }

    //communication condition
    //SPECIAL HANDLING IS REQUIRED SHOULD USE UNION INSTEAD OF INTERSECT
    if (condtionsMap.comm) {

        let commQueryObject: IQueryBuilderResponse = await getQueryForConnect(condtionsMap.comm, condtionsMap.dbname);
        //console.log("commQueryObject:------", JSON.stringify(commQueryObject));
        masterQuery += "," + commQueryObject.query;
        allInterimAlias.push(commQueryObject.alias);
        allInterimAliasConditions.push(commQueryObject.aliasCond);
    }

    masterQuery = cleanUpQuery(masterQuery);
    let isPatientLeadsQuery: boolean = condtionsMap.patientleads ? true : false;
    let isDmrQuery: boolean = condtionsMap.dmr ? true : false;
    let finalPartOfQuery = await createFinalPartOfQuery(
        allInterimAlias.toString().split(','),
        allInterimAliasConditions.toString().split(','),
        condtionsMap.dbname,
        condtionsMap.msg,
        isPatientLeadsQuery,
        isDmrQuery,
        condtionsMap.hascampaign ? condtionsMap.hascampaign : false,
        condtionsMap.campaignname ? condtionsMap.campaignname : '',
    );

    // TO SUPPORT DISTINCT MOBILE NUMBERS , DATED 11-07-2019
    let campaignBasedPart = '';
    if (condtionsMap.hascampaign) {
        if (condtionsMap.patientleads) {
            campaignBasedPart = `select is_valid_mobile, is_valid_email, patientid, biomarker_dates, biomarker_values, mid, labpatientid, centreid, bookingid, name, mobile, 
            email, camdate, labname as querylabname, msg,uniqueid, campaignname, null as channel,null as zone, labname from 
            (
            select 
            *, 
            ROW_NUMBER() OVER (PARTITION BY mobile ORDER BY patientid DESC) AS rnk from
    
            (`;

        }
        else if (condtionsMap.dmr) {
            campaignBasedPart = `select is_valid_mobile, is_valid_email, patientid, biomarker_dates, biomarker_values, mid, labpatientid, centreid, bookingid, name, mobile, 
            email, camdate, labname as querylabname, msg,uniqueid, campaignname, null as channel,null as zone, labname from 
            (
            select 
            *, 
            ROW_NUMBER() OVER (PARTITION BY mobile ORDER BY patientid DESC) AS rnk from
    
            (`;

        }
        else {
            campaignBasedPart = `select is_valid_mobile, is_valid_email, patientid, biomarker_dates, biomarker_values, mid, labpatientid, centreid, bookingid, name, mobile, 
            email, camdate, labname as querylabname, msg,uniqueid, campaignname, channel,null as zone, labname from 
            (
            select 
            *, 
            ROW_NUMBER() OVER (PARTITION BY mobile ORDER BY patientid DESC) AS rnk from
    
            (`;
        }
    }
    let baseQuery = `
    ${campaignBasedPart}
    WITH
    ${masterQuery}
    ${finalPartOfQuery}`

   // console.log("final query:============>", baseQuery);
    return { "query": baseQuery };


}



async function createFinalPartOfQuery(allAlias: string[], allAliasCondition: string[],
    dbName: string, msgCondition: IMessageInterface | undefined,
    isPatientLeadsQuery: boolean, isDmrQuery : boolean,
    hasCampaign: boolean, campaignName: string) {
    //including final view
    //console.log("allInterimAlias:::::::::::::::::::: ", allAlias);
    let baseQuery = `,${finalViewAlias} as (select distinct(patientid) from ${allAlias[0]}`;
    allAlias.splice(0, 1);
    allAliasCondition.splice(0, 1);
    var alias = 0;
    // for (var alias in allAlias) {
    for (alias = 0; alias < allAlias.length; ++alias) {
        //IF COMM OBJECT IS THERE AUTOMATICALLY IT WILL BE LAST OBJECT AND IT WILL CONTAIN "COMM"
        let currentAliasCondition = allAliasCondition[alias];
        if (allAlias[alias].indexOf(constants.commExcludeConditionViewAlias) > -1) {
            baseQuery += ` EXCEPT
            select distinct(patientid) from ${allAlias[alias]}
            `;
        }
        else {
            // if (allAlias[alias].indexOf(constants.commIncludeConditionViewAlias) > -1) {
            //     currentAliasCondition = " UNION";
            // }
            baseQuery += `
                ${currentAliasCondition} 
                select distinct(patientid) from ${allAlias[alias]}
            `;
        }

    }

    let lastPartOfQuery = `SELECT patientid,null as biomarker_values,null as biomarker_dates from ${finalViewAlias}`;
    //CHECK FOR biocodes request
    if (msgCondition && msgCondition.biocodes) {
        let bioMapQuery = await getQueryForBioMarkerMap(bioMapAlias, msgCondition.biocodes, finalViewAlias, dbName);
        lastPartOfQuery = `SELECT * from ${bioMapAlias}`;
        baseQuery += `),${bioMapQuery}`
    }
    let campaignBasedSuffix = '';
    if (hasCampaign) {
        campaignBasedSuffix = `      )
    )
    where rnk = 1`;
    }
    let transformedViewBasedOnMsg = await getQueryBasedOnMessage(msgCondition, dbName, isPatientLeadsQuery,isDmrQuery, campaignName);

    baseQuery += `)
    select  CASE 
    WHEN (b.hasvalidmobile)
    THEN 
    1
    else
    0
    end as is_valid_mobile,
    CASE 
    WHEN (b.hasvalidemail)
    THEN 
    1
    else
    0
    end 
    as is_valid_email,* from
   (${lastPartOfQuery}) as a
    inner join 
    ${transformedViewBasedOnMsg}
    on
    `;


    baseQuery = isPatientLeadsQuery ? `${baseQuery} a.patientid = b.labpatientid` : `${baseQuery} a.patientid = b.mid`;
    baseQuery = `${baseQuery} ${campaignBasedSuffix}`;
    // TO SUPPORT DISTINCT MOBILE NUMBERS , DATED 11-07-2019
    return baseQuery;

}