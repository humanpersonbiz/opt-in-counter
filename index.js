const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const xml2js = require('xml2js');
const dateFns = require('date-fns');

const app = express();
const port = process.env.PORT || 3000;

const jsonParser = bodyParser.json();
const parser = new xml2js.Parser();

require('dotenv').config();

const getOptInsXml = async (guid, keyword, startdate, enddate) => {
  try {
    const url =
      'http://www.repleotech.com/gateway/xml_opt_in_list.asp?' +
      `guid=${guid}&` +
      `keyword=${keyword}&` +
      `startdate=${startdate}&` +
      `enddate=${enddate}`;
    const result = await fetch(url);
    const xml = await result.text();

    return xml;
  } catch (error) {
    console.error(error);

    return null;
  }
};

const convertToJson = xml =>
  new Promise(resolve => {
    const errorObject = { status: 'error', json: null };

    // Pretty gross, huh? Gotta love ternaries...
    return xml
      ? parser.parseString(xml, (error, result) =>
          error
            ? resolve(errorObject)
            : resolve({ status: 'success', json: result }),
        )
      : resolve(errorObject);
  });

const processCount = json =>
  json &&
  json.optinlist &&
  json.optinlist.mobile &&
  json.optinlist.mobile.length
    ? json.optinlist.mobile.length.toString()
    : '0';

const getOptIns = async (
  guid = '{8311ADE2-2211-4704-BD86-8BC7EC25DB9B}',
  keyword = 'GAHS',
) => {
  const startdate = '01/01/2019';
  const enddate = dateFns.format(new Date(), 'MM/DD/YYYY');

  const xml = await getOptInsXml(guid, keyword, startdate, enddate);
  const { status, json } = await convertToJson(xml);
  const count = status === 'error' ? 'error' : processCount(json);

  return count;
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.post('/get-count', jsonParser, async (req, res) => {
  try {
    const guid = process.env.IVISION_GUID;
    const keyword = req.body.keyword;
    const optInsCount = await getOptIns(guid, keyword);

    res.send(optInsCount);
  } catch (error) {
    console.error(error);

    res.send('error');
  }
});

app.listen(port, () =>
  console.log(`On the server, listening to port: ${port}`),
);
