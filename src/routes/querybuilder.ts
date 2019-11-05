import { IQueryConditions } from './../interface';
import { getCompleteQuery } from './../query-builder';
import { executeQuery } from './../dal';

export async function getQueryForParameters(req, res, next) {

    try {
        var payload: IQueryConditions;
        try {
            if (req.query && typeof (req.query) == 'string') {
                payload = JSON.parse(req.query);
            }
            else {
                payload = req.query;
            }
        } catch (e) {
            payload = req.query;
        }
    } finally {

    }

    let generatedQuery = await getCompleteQuery(payload);

    let sqlres = await executeQuery(payload.dbname, generatedQuery);

    res.json(sqlres);

};

