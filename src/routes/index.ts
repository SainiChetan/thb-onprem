
import { getQueryForParameters } from './querybuilder';
import express = require('express');


let router = (express as any).Router();

const asyncMiddleware = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next))
        .catch(next);
};

router.post('/queryresult', asyncMiddleware(getQueryForParameters));

export = router;