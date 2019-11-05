import { IQueryConditions } from './../interface';
import { getCompleteQuery } from './../query-builder';
import { executeQuery } from './../dal/index';

export async function getQueryForParameters(req, res, next) {

    try {
        var payload: IQueryConditions;
        try {
            if (req.body && typeof (req.body) == 'string') {
                payload = JSON.parse(req.body);
            }
            else {
                payload = req.body;
            }
        } catch (e) {
            payload = req.body;
        }
    } finally {

    }

    console.log(payload);

    let generatedQuery = await getCompleteQuery(payload);

    //generatedQuery = `SELECT patientid, biomarkermetaid, bookingid, bookingdate, creationdate, valued, testid, testname, biomarkercode, labname FROM "public".biomarkers_cta limit 10`
    let sqlres = await executeQuery(payload.dbname, generatedQuery);

    console.log(sqlres);

    res.json(sqlres);

};

