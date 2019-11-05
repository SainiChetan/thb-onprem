let knexPool = {};
//var pg = require('knex')({client: 'pg'});


export function getKnexConnection(dbName) {
    if (knexPool["sunshine"])
        return knexPool["sunshine"];
    return createKnexConnection("sunshine");
};

export function createKnexConnection(dbName) {
    knexPool["sunshine"] = require('knex')({
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
    return knexPool["sunshine"];
};



export async function executeQuery(dbName, query) {
    let knex = getKnexConnection(dbName);
    console.log(query);
    return await knex.transaction(async (trx) => {
        try {
            let res = await knex.raw(query).transacting(trx);
            await trx.commit();

        } catch (err) {
            console.log(" catch1 -err " + err)
            return {
                error: err,
                result: null
            };
        }
    }).then(async function (err, result) {
        console.log(err, result);
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
