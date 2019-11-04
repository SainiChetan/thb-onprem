let knexPool = {};


export function getKnexConnection(dbName) {
    if (knexPool[dbName])
        return knexPool[dbName];
    return createKnexConnection(dbName);
};

export function createKnexConnection(dbName) {
    knexPool[dbName] = require('knex')({
        client: 'pg',
        connection: {
            host: "13.127.228.23",//process.env.POSTGRES_SERVERNAME,
            user: "postgres",//process.env.POSTGRES_USERNAME,
            password: "postgres",//process.env.POSTGRES_PASSWORD,
            database: "sunshine"//dbName
        },
        pool: {
            min: 0,
            max: 10
        },
        acquireConnectionTimeout: 60000
    });
    return knexPool[dbName];
};



export async function executeQuery(dbName, query) {
    let knex = getKnexConnection(dbName);
    return await knex.transaction(async (trx) => {
        try {
            //let queryArr = getQueriesForIntraRulesMovement(rulesArray);
            //let query = queryArr.join(';');
            let res = await knex.raw(query).transacting(trx);
            await trx.commit();

        } catch (err) {
            console.log(" catch1 -err " + err)
            return {
                error: err,
                result: null
            };
        }
    }).then(async function (result) {
        console.log(result);
        return {
            error: result ? result.error : null,
            result: result ? result.result : null
        };
    }).catch(async function (err) {
        console.log(" catch2 -err " + err)
        return {
            error: err,
            result: null
        };
    });
}
