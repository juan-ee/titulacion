const ga = require('ga-tsp');
const kmeans =  require('kmeans-same-size');
const app =  require('express')();
const api = require('./apis');
var bodyParser = require('body-parser');


app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.listen(3000);
app.locals.title = 'My App';

app.get('/params', function (req, res) { //query params
    // ?order=desc&shoe[color]=blue&shoe[type]=converse   => { order: 'desc', shoe: { color: 'blue', type: 'converse' } }
    var color = req.query.color;
    res.send('color: '+color+'\n'+req.query);
});

app.get('/id/:id', function (req, res) { //route params
    res.send('id: '+req.params.id);
});


app.param('id', function(req, res, next, name) { //midleware
    var modified = name + '-dude';

    // save name to the request
    req.name = modified;

    next();
});

// app.get('/pois', function (req, res) { //?location[lat]=40.765068&location[lng]=-73.987452&days=3&categories[]=museum&categories[]=church&categories[]=park
//     const userInfo = req.query;
//     res.json(userInfo);
// });

app.get('/pois',function (req,res) {
    const userInfo = req.query;
    var pois = [];
    var promises = [];
    for(var i in userInfo.categories){
        promises.push(
            new Promise(function (resolve) {
                api.getPois(userInfo.location,userInfo.categories[i],function (results) {
                    resolve(results);
                });
            })
        );
    }
    Promise.all(promises).then(function (results) {
        pois = pois.concat.apply(pois, results);
        getDetails(pois,res);
    });
});


function getDetails(pois,res){
    var promises=[];

    for(var i in pois){
        if (pois[i].rating !== undefined){
            promises.push(
                new Promise(function (resolve) {
                    api.getDetails(pois[i].place_id,function (result) {
                        resolve(result);
                    });
                })
            );
        }
    }
    Promise.all(promises).then(function (pois) {
        res.json(pois);
    });
}