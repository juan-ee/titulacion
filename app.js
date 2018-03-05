const ga = require('ga-tsp');
const KmeansLib = require('kmeans-same-size');
const app =  require('express')();
const api = require('./apis');
// const bodyParser = require('body-parser');
// const fs = require('fs');

app.set('view engine', 'ejs');
// app.use(bodyParser.json()); // support json encoded bodies
// app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.listen(3000);
// app.locals.title = 'My App';

// app.get('/params', function (req, res) { //query params
//     // ?order=desc&shoe[color]=blue&shoe[type]=converse   => { order: 'desc', shoe: { color: 'blue', type: 'converse' } }
//     var color = req.query.color;
//     res.send('color: '+color+'\n'+req.query);
// });
//
// app.get('/id/:id', function (req, res) { //route params
//     res.send('id: '+req.params.id);
// });
//
//
// app.param('id', function(req, res, next, name) { //midleware
//     var modified = name + '-dude';
//
//     // save name to the request
//     req.name = modified;
//
//     next();
// });

// app.get('/pois', function (req, res) { //?location[lat]=40.765068&location[lng]=-73.987452&days=3&categories[]=museum&categories[]=church&categories[]=park
//     const userInfo = req.query;
//     res.json(userInfo);
// });

app.get('/pois',function (req,res) {
    const userInfo = req.query;
    var pois = [];
    var promises = [];
    userInfo.location = {
        lat:parseFloat(userInfo.location.lat),
        lng:parseFloat(userInfo.location.lng)
    }
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
        getDetails(pois,function (pois_details) {
            getClusters(pois_details,userInfo.days,function (clusters) {
                getTours(clusters,userInfo.location,function (results) {
                    res.render('map',{array:results});
                })
            });
        });

    });
});


function getDetails(pois,callback){
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
        callback(pois);
    });
}

function getClusters(pois,days,callback) { //ordenar de menor a mayor PILAS, de acuerdo al tiempo
    var kmeans =  new KmeansLib();
    var clusters=new Array(days);

    // ver luego lo de Location
    pois.map(function (poi) {
        poi.lat = poi.location.lat;
        poi.lng = poi.location.lng;
        return poi;
    });

    kmeans.init({k: days, runs: ~~(pois.length / days), equalSize: true, normalize: false });
    kmeans.calc(pois);

    // group in clusters
    for(i in pois){
        var index=pois[i].k;
        delete pois[i].k;
        try{
            clusters[index].push(pois[i]);
        }catch(err){
            clusters[index]=[];
            clusters[index].push(pois[i]);
        }
    }
    callback(clusters);
}



function getTours(clusters,userLocation,callback) {
    var tours = [];
    var promises = [];
    const keys = ['AIzaSyAgg8nvSsVsJo_fOvJB0113sJ9saV6BgEo','AIzaSyDZJ4eK77EVxoJsUIzqUZMJgpmxJsFQvyo','AIzaSyCfqVM0MdOINSwxu_n9Sy_nYzs29-La-zE'];
    clusters.forEach(function (cluster,index,clusters) {
        //--------RESOLVER ESTO LUEGO---------
        cluster.sort(function(a, b) {
            return b.rating - a.rating;
        });
        clusters[index] = cluster.slice(0,6);
        clusters[index].unshift({location:userLocation});
        //------------------------------------
        promises.push(new Promise(function (resolve) {
            api.getMatrix(clusters[index],keys[index],function (matrix) {
                resolve(matrix);
            });
        }));
    });

    Promise.all(promises).then(function (matrixes) {
        //quitar esto
        // fs.appendFileSync('matrixes.txt', `\n-------\n${JSON.stringify(matrixes)}\n-------\n`);
        // fs.appendFileSync('matrixes.txt', `\n-------\n${JSON.stringify(clusters)}\n-------\n`);

        // ------------resolver de acuerdo a las fechas escogidas-------------
        var date = new Date(new Date().toDateString().split(' ').splice(1,3).join(' ')+' 10:00:00');
        //----------------------------------------------------------------
        for(var i in matrixes){
            date.setDate(date.getDate()+1);
            const parameters = {
                baseRoute:clusters[i],
                date:date,
                totalCities:clusters[i].length,
                distanceMatrix:matrixes[i],
                mutation_rate: 0.03,
                sizePopulation:clusters[i].length*clusters[i].length,
                totalGenerations:10*clusters[i].length
            };
            tours.push(ga.evolve(parameters));
        }
        callback(tours);
    });
}

app.get('/test',function (req,res) {

    var date = new Date(new Date().toDateString().split(' ').splice(1,3).join(' ')+' 10:00:00');
    var tours = [];
    for(var i in matrixes){
        const parameters = {
            baseRoute:clusters[i],
            date:date,
            totalCities:clusters[i].length,
            distanceMatrix:matrixes[i],
            mutation_rate: 0.03,
            sizePopulation:clusters[i].length*clusters[i].length,
            totalGenerations:50
        };
        tours.push(ga.evolve(parameters));
    }
    res.json(tours);
});
