export interface IResponse {
    statusCode: number
    body: any
    headers: any
}

export interface IResponseBody {
    status: number
    message: string
    result: any
}


export interface IQuery {
    query: string,
    submitter?: string
}


export interface IBiomarkerCondition {
    "biomarkercode"?: string,
    "biomarkermetaid"?: number,
    "testname"?: string,
    "value"?: number,
    "value1"?: number,
    "value2"?: number,
    "text"?: string,
    "condition": string,
    "dbCond": string,
    "scope": "include" | "exclude",
    // "compcondition" ?: "UNION" | "INTERSECT" 
}


export interface IPatientCondition {
    "factor"?: 'all' | 'age' | 'gender' | 'visittype' | 'visitcount' | 'lcenter' |
    'lastvisitdate' | 'center' | 'patienttype' | 'channel' | 'novc' | 'addr'
    | 'joiningdate' | 'winback',
    "value"?: number | string | string[],
    "value1"?: number | string,
    "value2"?: number | string,
    "condition": string,
    "dbCond": string,
    "scope": "include" | "exclude"
}


export interface IPatientLeadCondition {
    "factor"?: 'all' | 'age' | 'gender' | 'city' | 'channel' | 'joiningdate' | 'returned',
    "value"?: number | string | string[],
    "value1"?: number | string,
    "value2"?: number | string,
    "condition": string,
    "subcondition"?: string,
    "dbCond": string,
    "scope": "include" | "exclude"
}

export interface IDMRCondition {
    "factor"?: 'all' | 'age' | 'gender' | 'city' | 'channel' | 'doctorname' |
    'designation' | 'specialization' | 'region' | 'department' | 'prescribertype' |
    'degree' | 'state' | 'hospital' | 'countrycode' | 'custom1'
    | 'custom2' | 'custom3' | 'emailcamp' | 'smscamp' | 'whatscamp',
    "value"?: any,
    "value1"?: number | string | string[],
    "value2"?: number | string | string[],
    "condition": string,
    "subcondition"?: string,
    "dbCond": string,
    "scope": "include" | "exclude"
}



export interface IBillingCondition {
    "factor"?: 'package' | 'billingitems' | 'department' | 'servicetype' | 'patienttype' | 'referalname' | 'referaldoctor',
    "items"?: string[],
    "condition": string,
    "value"?: string,
    "date"?: string,
    "date1"?: string,
    "date2"?: string,
    "dbCond": string,
    "scope": "include" | "exclude"
}

export interface IEmrCondition {
    "factor"?: 'level1' | 'level2',
    "items"?: string[],
    "textval"?: string,
    "condition": string,
    "value"?: string,
    "value1"?: string,
    "value2"?: string,
    "date"?: string,
    "date1"?: string,
    "date2"?: string,
    "dbCond": string,
    "scope": "include" | "exclude"
}


export interface ICommCondition {
    "factor": "createddate" | "campaign",
    "condition": string,
    "date"?: string,
    // "date1" ?: string,
    // "date2" ?: string,
    "dbCond": string,
    "scope": "include" | "exclude"
}

export interface ICommConditions {
    normal?: ICommCondition[],
    "compcondition"?: "OR" | "AND"
}

export interface IModuleCondition {
    "normal": any[]
    "latest"?: any[],
}


export interface IBillingModuleConditions {
    "normal"?: IBillingCondition[],
    "compcondition"?: "OR" | "AND"
}

export interface IEmrModuleConditions {
    "normal"?: IEmrCondition[],
    "compcondition"?: "OR" | "AND"
}

export interface IPatientModuleConditions {
    "normal"?: IPatientCondition[],
    "compcondition"?: "OR" | "AND"
}

export interface IPatientLeadsModuleConditions {
    "normal"?: IPatientLeadCondition[],
    "compcondition"?: "OR" | "AND"
}
export interface IDmrModuleConditions {
    "normal"?: IDMRCondition[],
    "compcondition"?: "OR" | "AND"
}

export interface IBioNumericInterface {
    "normal"?: IBiomarkerCondition[],
    "latest"?: IBiomarkerCondition[],
    "compcondition"?: "OR" | "AND"
}

export interface IBioTextInterface {
    "text"?: IBiomarkerCondition[],
    "textlatest"?: IBiomarkerCondition[],
    "compcondition"?: "OR" | "AND"
}

export interface IBiomarkerModuleConditions {
    "normal"?: IBiomarkerCondition[],
    "latest"?: IBiomarkerCondition[],
    "text"?: IBiomarkerCondition[],
    "textlatest"?: IBiomarkerCondition[],
    "bionumeric"?: IBioNumericInterface,
    "biotext"?: IBioTextInterface
}

export interface IQueryConditions {
    "dbname": string,
    "campaignname"?: string,
    "dcache"?: 0 | 1,
    "biomarker"?: IBiomarkerModuleConditions,
    "billing"?: IBillingModuleConditions,
    "patient"?: IPatientModuleConditions,
    "patientleads"?: IPatientModuleConditions,
    "dmr"?: IDmrModuleConditions,
    "emr"?: IEmrModuleConditions,
    "comm"?: ICommConditions,
    "msg"?: IMessageInterface,
    "notification_id"?: string,
    "click_action"?: string,
    "mobile"?: string,
    "en_queryString"?: string,
    "hascampaign"?: boolean,
    "scope"?: string,
    "template_type"?: string,
    "comm_channel"?: string,
    "comm_data"?: IEmailData
}


export interface IEmailData {
    "subject": string,
    "attachment": string[],
    "templateid": string
}

export interface ISMSAnalysisCondition {
    "dbname": string,
    "dcache"?: 0 | 1,
    "msg"?: IMessageInterface,
    "notification_id"?: string,
    "click_action"?: string,
    "queryid"?: string,
    "servername"?: string
    "scope"?: string
    "commtype"?: string
}

export interface ICommStatusCondition {
    "scope": "engagement" | "connect" | "all" | 're' | 'nps',
    "fdate": string,
    "todate": string,
    "dbname"?: string,
    "notification_id"?: string,
    "click_action"?: string
    "labname"?: string
}

export interface IMessageInterface {
    "message": string,
    "includeGreeting"?: boolean,
    "greetings"?: string,
    "biocodes"?: string[],
    "greetingsFactor"?: "none" | "firstname" | "fullname",
    "campaign"?: string

}
export interface IQueryBuilderResponse {
    "query": string,
    "alias": string[],
    "aliasCond": string[] //"UNION" | "INTERSECT" | "EXCEPT" []
}

export interface IUpdateCache {
    "cachekey": string,
    "type": string,
    "conditionMap": ICommStatusCondition
}

export interface ICacheResponse {
    status: number,
    roiinsights?: string,
    msginsights?: string,
    chartinsights?: string,
    revenueInsights?: string,
    campinsights?: string
    scope?: string,
    error?: string

}

export interface ICacheResponseQB {
    status: number,
    baseQuery: string,
    scope?: string,
    campaign?: string,
    query?: string,
    error?: string

}


export interface IMetaObject {
    labname: string,
    state: string,
    data: {},
    updatedTime: number,
    encrypted: number
}

