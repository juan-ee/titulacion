const ga = require('ga-tsp');
const KmeansLib = require('kmeans-same-size');
const app =  require('express')();
const api = require('./apis');
// const bodyParser = require('body-parser');
// const fs = require('fs');

app.set('view engine', 'ejs');
// app.use(bodyParser.json()); // support json encoded bodies
// app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.listen(8080);
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
    };
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
    var n = -1;
    const keys = ['AIzaSyAgg8nvSsVsJo_fOvJB0113sJ9saV6BgEo','AIzaSyDZJ4eK77EVxoJsUIzqUZMJgpmxJsFQvyo','AIzaSyCfqVM0MdOINSwxu_n9Sy_nYzs29-La-zE','AIzaSyBjLWzGBsWZIBwBNVMCqXbjwFEzNfomR0k'];

    clusters.forEach(function (cluster,index,clusters) {
        n++;
        n = n == keys.length ? 0 : n ;

        //--------RESOLVER ESTO LUEGO---------
        cluster.sort(function(a, b) {
            return b.rating - a.rating;
        });
        clusters[index] = cluster.slice(0,6);
        clusters[index].unshift({location:userLocation});
        //------------------------------------
        promises.push(new Promise(function (resolve) {
            api.getMatrix(clusters[index],keys[n],function (matrix) {
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

app.get('/',function (req,res) {
    const pois = [[{"poi":{"location":{"lat":40.765068,"lng":-73.987452}}},{"route":"y}xwFvsqbMvEcO|BxAxFvD|BxAt@_C","departure":"09:52:18","arrival":"10:00:00"},{"poi":{"formatted_address":"239 W 49th St, New York, NY 10019, USA","formatted_phone_number":"(212) 489-1340","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"069191df869e8899b20faf0054b864635fad79f0","international_phone_number":"+1 212-489-1340","name":"St. Malachy's The Actors' Church","place_id":"ChIJraGjj1ZYwokRA28pO9tvt48","rating":5,"url":"https://maps.google.com/?cid=10355868855542836995","utc_offset":-300,"vicinity":"239 West 49th Street, New York","website":"http://www.actorschapel.org/","location":{"lat":40.761579,"lng":-73.98578549999999},"expected_time":31,"lat":40.761579,"lng":-73.98578549999999},"start":"10:00:00","end":"10:31:00"},{"route":"uexwF~jqbMo\\`eAQh@h@^`BfAIXtExCNRDFGBKDGLeEvN","start":"10:31:00","end":"10:51:25"},{"poi":{"formatted_address":"Pier 86, 12th Ave & W 46th St, New York, NY 10036, USA","formatted_phone_number":"(212) 245-0072","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"478ff2e8a2918302e49fac497fc7ad24f46842b1","international_phone_number":"+1 212-245-0072","name":"Space Shuttle Pavillion","opening_hours":{"open_now":true,"periods":[{"close":{"day":0,"time":"1700"},"open":{"day":0,"time":"1000"}},{"close":{"day":1,"time":"1700"},"open":{"day":1,"time":"1000"}},{"close":{"day":2,"time":"1700"},"open":{"day":2,"time":"1000"}},{"close":{"day":3,"time":"1700"},"open":{"day":3,"time":"1000"}},{"close":{"day":4,"time":"1700"},"open":{"day":4,"time":"1000"}},{"close":{"day":5,"time":"1700"},"open":{"day":5,"time":"1000"}},{"close":{"day":6,"time":"1700"},"open":{"day":6,"time":"1000"}}],"weekday_text":["Monday: 10:00 AM – 5:00 PM","Tuesday: 10:00 AM – 5:00 PM","Wednesday: 10:00 AM – 5:00 PM","Thursday: 10:00 AM – 5:00 PM","Friday: 10:00 AM – 5:00 PM","Saturday: 10:00 AM – 5:00 PM","Sunday: 10:00 AM – 5:00 PM"]},"place_id":"ChIJqYNWJ0lYwokR0bWj13-SWEk","rating":4.6,"url":"https://maps.google.com/?cid=5285135240495609297","utc_offset":-300,"vicinity":"Pier 86, 12th Avenue & W 46th St, New York","website":"http://www.intrepidmuseum.org/shuttle/Home.aspx","location":{"lat":40.76514179999999,"lng":-74.0017859},"expected_time":31,"lat":40.76514179999999,"lng":-74.0017859},"start":"10:51:25","end":"11:22:25"},{"route":"cxxwFf|sbMECGBKDGLeEvN","start":"11:22:25","end":"11:25:30"},{"poi":{"formatted_address":"Pier 86, W 46th St & 12th Ave, New York, NY 10036, USA","formatted_phone_number":"(212) 245-0072","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"6bb43beb2047e4db91e332d24782460ccf8194c2","international_phone_number":"+1 212-245-0072","name":"Intrepid Sea, Air & Space Museum","opening_hours":{"open_now":true,"periods":[{"close":{"day":0,"time":"1700"},"open":{"day":0,"time":"1000"}},{"close":{"day":1,"time":"1700"},"open":{"day":1,"time":"1000"}},{"close":{"day":2,"time":"1700"},"open":{"day":2,"time":"1000"}},{"close":{"day":3,"time":"1700"},"open":{"day":3,"time":"1000"}},{"close":{"day":4,"time":"1700"},"open":{"day":4,"time":"1000"}},{"close":{"day":5,"time":"1700"},"open":{"day":5,"time":"1000"}},{"close":{"day":6,"time":"1700"},"open":{"day":6,"time":"1000"}}],"weekday_text":["Monday: 10:00 AM – 5:00 PM","Tuesday: 10:00 AM – 5:00 PM","Wednesday: 10:00 AM – 5:00 PM","Thursday: 10:00 AM – 5:00 PM","Friday: 10:00 AM – 5:00 PM","Saturday: 10:00 AM – 5:00 PM","Sunday: 10:00 AM – 5:00 PM"]},"place_id":"ChIJnxlg1U5YwokR8T90UrZiIwI","rating":4.6,"url":"https://maps.google.com/?cid=154075347467649009","utc_offset":-300,"vicinity":"Pier 86, West 46th Street & 12th Ave, New York","website":"http://www.intrepidmuseum.org/","location":{"lat":40.7645266,"lng":-73.99960759999999},"expected_time":50,"lat":40.7645266,"lng":-73.99960759999999},"start":"11:25:30","end":"12:15:30"},{"route":"cevwFzrtbM?ECEiK`\\Ib@iCs@}@_@]Si@a@oJiGoBmAQj@KTyGoEuD_CaDwB_BcAc@QeCcBIMeAu@g@e@c@c@gBkCwAcCc@w@g@e@uCoB","start":"12:15:30","end":"12:40:01"},{"poi":{"formatted_address":"New York, NY 10011, USA","formatted_phone_number":"(212) 500-6035","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_recreational-71.png","id":"72dc79d023feec77725d7336e7c46fee27805319","international_phone_number":"+1 212-500-6035","name":"The High Line","opening_hours":{"open_now":true,"periods":[{"close":{"day":0,"time":"1900"},"open":{"day":0,"time":"0700"}},{"close":{"day":1,"time":"1900"},"open":{"day":1,"time":"0700"}},{"close":{"day":2,"time":"1900"},"open":{"day":2,"time":"0700"}},{"close":{"day":3,"time":"1900"},"open":{"day":3,"time":"0700"}},{"close":{"day":4,"time":"1900"},"open":{"day":4,"time":"0700"}},{"close":{"day":5,"time":"1900"},"open":{"day":5,"time":"0700"}},{"close":{"day":6,"time":"1900"},"open":{"day":6,"time":"0700"}}],"weekday_text":["Monday: 7:00 AM – 7:00 PM","Tuesday: 7:00 AM – 7:00 PM","Wednesday: 7:00 AM – 7:00 PM","Thursday: 7:00 AM – 7:00 PM","Friday: 7:00 AM – 7:00 PM","Saturday: 7:00 AM – 7:00 PM","Sunday: 7:00 AM – 7:00 PM"]},"place_id":"ChIJ5bQPhMdZwokRkTwKhVxhP1g","rating":4.7,"url":"https://maps.google.com/?cid=6358908248867355793","utc_offset":-300,"vicinity":"New York","website":"http://www.thehighline.org/","location":{"lat":40.7479925,"lng":-74.0047649},"expected_time":37,"lat":40.7479925,"lng":-74.0047649},"start":"12:40:01","end":"13:17:01"},{"route":"cevwFzrtbM?ECE~GgTVqADs@CsAJ}@`@wAZo@`@]p@a@Zg@\\w@|Mqb@mNgJ}F_EoCaBWMsIwFwFyD{BwADI","start":"13:17:01","end":"13:45:41"},{"lunch":true,"location":{"lat":40.7535965,"lng":-73.9832326},"start":"13:45:41","end":"14:45:41"},{"poi":{"formatted_address":"New York, NY 10018, USA","formatted_phone_number":"(212) 768-4242","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_recreational-71.png","id":"f450a4290a3af961748f0eb93931479d2898e990","international_phone_number":"+1 212-768-4242","name":"Bryant Park","opening_hours":{"open_now":true,"periods":[{"close":{"day":0,"time":"2200"},"open":{"day":0,"time":"0700"}},{"close":{"day":1,"time":"2200"},"open":{"day":1,"time":"0700"}},{"close":{"day":2,"time":"2200"},"open":{"day":2,"time":"0700"}},{"close":{"day":3,"time":"2200"},"open":{"day":3,"time":"0700"}},{"close":{"day":4,"time":"2200"},"open":{"day":4,"time":"0700"}},{"close":{"day":5,"time":"2200"},"open":{"day":5,"time":"0700"}},{"close":{"day":6,"time":"2200"},"open":{"day":6,"time":"0700"}}],"weekday_text":["Monday: 7:00 AM – 10:00 PM","Tuesday: 7:00 AM – 10:00 PM","Wednesday: 7:00 AM – 10:00 PM","Thursday: 7:00 AM – 10:00 PM","Friday: 7:00 AM – 10:00 PM","Saturday: 7:00 AM – 10:00 PM","Sunday: 7:00 AM – 10:00 PM"]},"place_id":"ChIJvbGg56pZwokRp_E3JbivnLQ","rating":4.6,"url":"https://maps.google.com/?cid=13014470228627157415","utc_offset":-300,"vicinity":"New York","website":"http://www.bryantpark.org/","location":{"lat":40.7535965,"lng":-73.9832326},"expected_time":86,"lat":40.7535965,"lng":-73.9832326},"start":"14:45:41","end":"16:11:41"},{"route":"qkxwFv`qbMr@wBx@b@bEbCv@XlAj@lCr@zGbBD@B?HIFID?J@x@^n@LhCv@d@VhBr@`CoHbAaDJYVL","start":"16:11:41","end":"16:25:08"},{"poi":{"formatted_address":"237 W 51st St, New York, NY 10019, USA","formatted_phone_number":"(212) 541-6300","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"bb4ac2e4ec26910d50f4cf23c1b1bb448d9e63e6","international_phone_number":"+1 212-541-6300","name":"Times Square Church","opening_hours":{"open_now":false,"periods":[{"close":{"day":0,"time":"2000"},"open":{"day":0,"time":"0800"}},{"close":{"day":2,"time":"2100"},"open":{"day":2,"time":"1700"}},{"close":{"day":5,"time":"2100"},"open":{"day":5,"time":"1730"}}],"weekday_text":["Monday: Closed","Tuesday: 5:00 – 9:00 PM","Wednesday: Closed","Thursday: Closed","Friday: 5:30 – 9:00 PM","Saturday: Closed","Sunday: 8:00 AM – 8:00 PM"]},"place_id":"ChIJVUGHS1ZYwokRx39CH6zNL5M","rating":4.7,"url":"https://maps.google.com/?cid=10605921786623328199","utc_offset":-300,"vicinity":"237 West 51st Street, New York","website":"http://tsc.nyc/","location":{"lat":40.76234169999999,"lng":-73.98393879999999},"expected_time":57,"lat":40.76234169999999,"lng":-73.98393879999999},"start":"16:25:08","end":"17:22:08"}],[{"poi":{"location":{"lat":40.765068,"lng":-73.987452}}},{"route":"y}xwFvsqbMvEcO}ByA{B}AcJ}FqAaAUW@E@K@WAQAOKWSSQKUGE?@_AB{AJ_AJi@Tm@Pq@?i@GqA[e@o@oAQUGGDQPk@T}@HQCUIo@KWOSgAaBc@UU[_@o@Oc@QYYQ{@e@CCAIGe@KIACAI?u@k@uAk@qBSYMEQC]B_BKw@WgAq@qCaBq@W?i@Ks@GM]Ye@MMIOUUEI?Hk@PqAu@WM}@ES[o@QK[_@AAGBQHa@RYo@_@w@AS?_AOe@s@uAO_@HOTYUq@a@kA]o@qAaAw@[WQ]s@Mg@Ke@CeAAa@CaAOm@WUMS[aAQk@L_@H]@g@{CqBiCcB","departure":"09:20:56","arrival":"10:00:00"},{"poi":{"formatted_address":"1000 5th Ave, New York, NY 10028, USA","formatted_phone_number":"(212) 535-7710","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"f732f202150af1f14ae8a057a1014ceea6b33fc4","international_phone_number":"+1 212-535-7710","name":"The Metropolitan Museum of Art","opening_hours":{"open_now":true,"periods":[{"close":{"day":0,"time":"1730"},"open":{"day":0,"time":"1000"}},{"close":{"day":1,"time":"1730"},"open":{"day":1,"time":"1000"}},{"close":{"day":2,"time":"1730"},"open":{"day":2,"time":"1000"}},{"close":{"day":3,"time":"1730"},"open":{"day":3,"time":"1000"}},{"close":{"day":4,"time":"1730"},"open":{"day":4,"time":"1000"}},{"close":{"day":5,"time":"2100"},"open":{"day":5,"time":"1000"}},{"close":{"day":6,"time":"2100"},"open":{"day":6,"time":"1000"}}],"weekday_text":["Monday: 10:00 AM – 5:30 PM","Tuesday: 10:00 AM – 5:30 PM","Wednesday: 10:00 AM – 5:30 PM","Thursday: 10:00 AM – 5:30 PM","Friday: 10:00 AM – 9:00 PM","Saturday: 10:00 AM – 9:00 PM","Sunday: 10:00 AM – 5:30 PM"]},"place_id":"ChIJb8Jg9pZYwokR-qHGtvSkLzs","rating":4.8,"url":"https://maps.google.com/?cid=4264808743088595450","utc_offset":-300,"vicinity":"1000 5th Avenue, New York","website":"http://www.metmuseum.org/","location":{"lat":40.7794366,"lng":-73.963244},"expected_time":90,"lat":40.7794366,"lng":-73.963244},"start":"10:00:00","end":"11:30:00"},{"route":"yo{wF`zlbMhCbBdBjAIT","start":"11:30:00","end":"11:31:52"},{"poi":{"formatted_address":"New York, NY, USA","formatted_phone_number":"(212) 310-6600","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_recreational-71.png","id":"c9bcef33f0cc85eda31f1c7444e9b1a3b82c9a9f","international_phone_number":"+1 212-310-6600","name":"Central Park","opening_hours":{"open_now":true,"periods":[{"close":{"day":1,"time":"0100"},"open":{"day":0,"time":"0600"}},{"close":{"day":2,"time":"0100"},"open":{"day":1,"time":"0600"}},{"close":{"day":3,"time":"0100"},"open":{"day":2,"time":"0600"}},{"close":{"day":4,"time":"0100"},"open":{"day":3,"time":"0600"}},{"close":{"day":5,"time":"0100"},"open":{"day":4,"time":"0600"}},{"close":{"day":6,"time":"0100"},"open":{"day":5,"time":"0600"}},{"close":{"day":0,"time":"0100"},"open":{"day":6,"time":"0600"}}],"weekday_text":["Monday: 6:00 AM – 1:00 AM","Tuesday: 6:00 AM – 1:00 AM","Wednesday: 6:00 AM – 1:00 AM","Thursday: 6:00 AM – 1:00 AM","Friday: 6:00 AM – 1:00 AM","Saturday: 6:00 AM – 1:00 AM","Sunday: 6:00 AM – 1:00 AM"]},"place_id":"ChIJ4zGFAZpYwokRGUGph3Mf37k","rating":4.8,"url":"https://maps.google.com/?cid=13393458397880860953","utc_offset":-300,"vicinity":"New York","website":"http://www.centralparknyc.org/","location":{"lat":40.7828647,"lng":-73.9653551},"expected_time":81,"lat":40.7828647,"lng":-73.9653551},"start":"11:31:52","end":"12:52:52"},{"route":"yk|wFnppbMjLw^DU@M`BkFjCkIHOLQ","start":"12:52:52","end":"13:03:25"},{"lunch":true,"location":{"lat":40.7830266,"lng":-73.981556},"start":"13:03:25","end":"14:03:25"},{"poi":{"formatted_address":"245 W 77th St, New York, NY 10024, USA","formatted_phone_number":"(212) 787-1566","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"c37598b36a40ed9f36c4e51c3a6149d24123af75","international_phone_number":"+1 212-787-1566","name":"West End Collegiate Church","opening_hours":{"open_now":true,"periods":[{"close":{"day":0,"time":"1630"},"open":{"day":0,"time":"0900"}},{"close":{"day":1,"time":"1630"},"open":{"day":1,"time":"0900"}},{"close":{"day":2,"time":"1630"},"open":{"day":2,"time":"0900"}},{"close":{"day":3,"time":"1630"},"open":{"day":3,"time":"0900"}},{"close":{"day":4,"time":"1630"},"open":{"day":4,"time":"0900"}},{"close":{"day":5,"time":"1630"},"open":{"day":5,"time":"0900"}},{"close":{"day":6,"time":"1630"},"open":{"day":6,"time":"0900"}}],"weekday_text":["Monday: 9:00 AM – 4:30 PM","Tuesday: 9:00 AM – 4:30 PM","Wednesday: 9:00 AM – 4:30 PM","Thursday: 9:00 AM – 4:30 PM","Friday: 9:00 AM – 4:30 PM","Saturday: 9:00 AM – 4:30 PM","Sunday: 9:00 AM – 4:30 PM"]},"place_id":"ChIJk5YAFohYwokRAJaf5X-GeCk","rating":5,"url":"https://maps.google.com/?cid=2988286236631733760","utc_offset":-300,"vicinity":"245 West 77th Street, New York","website":"http://www.westendchurch.org/","location":{"lat":40.7830266,"lng":-73.981556},"expected_time":61,"lat":40.7830266,"lng":-73.981556},"start":"14:03:25","end":"15:04:25"},{"route":"yk|wFnppbM~@wCPDpGxA`KrBdAPxBXF?d@B\\Eh@@x@@~DFbDBzCHbDBhCC^?Jk@Pk@bEoM","start":"15:04:25","end":"15:22:30"},{"poi":{"formatted_address":"3 W 65th St, New York, NY 10023, USA","formatted_phone_number":"(212) 877-6815","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"a3d4fefa1ac2674697e902b47213cc077371bad6","international_phone_number":"+1 212-877-6815","name":"Holy Trinity Lutheran Church","place_id":"ChIJl4xr-fRYwokRvITflUru_ns","rating":4.9,"url":"https://maps.google.com/?cid=8934840714859087036","utc_offset":-300,"vicinity":"3 West 65th Street, New York","website":"http://www.holytrinitynyc.org/","location":{"lat":40.77208590000001,"lng":-73.97945229999999},"expected_time":66,"lat":40.77208590000001,"lng":-73.97945229999999},"start":"15:22:30","end":"16:28:30"},{"route":"sgzwFfcpbMoEnNdAt@dAl@p@f@z@j@xBzA~BtAxBzAbCzAy@hC","start":"16:28:30","end":"16:38:46"},{"poi":{"formatted_address":"405 W 59th St, New York, NY 10019, USA","formatted_phone_number":"(212) 265-3495","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"9a21620619374c7cd37052f0318612c6b8c3f48b","international_phone_number":"+1 212-265-3495","name":"The Church of St. Paul the Apostle","place_id":"ChIJC1050FhYwokR_5BJB8M4-bo","rating":4.8,"url":"https://maps.google.com/?cid=13472862170547589375","utc_offset":-300,"vicinity":"405 West 59th Street, New York","website":"http://www.stpaultheapostle.org/","location":{"lat":40.7699132,"lng":-73.985153},"expected_time":68,"lat":40.7699132,"lng":-73.985153},"start":"16:38:46","end":"17:46:46"},{"route":"ce|wFtznbMOMELMXSR]HG@ADAF?J?NBT?HS`@Sp@FJBN@\\CPPJv@j@Xd@Hd@Ad@G\\|BxAvBvA`G~D`CvA|B|AnGlExFnDxFxDdElCzB|AdAl@p@f@z@j@xBzA~BtAxBzAbCzAy@hC","start":"17:46:46","end":"18:11:42"},{"poi":{"formatted_address":"175-208 79th Street Central Park West, New York, NY 10024, USA","formatted_phone_number":"(212) 769-5100","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"c413262999f0818e8355b7539ff6eaf8eb6d0550","international_phone_number":"+1 212-769-5100","name":"Rose Center for Earth & Space","opening_hours":{"open_now":true,"periods":[{"close":{"day":0,"time":"1745"},"open":{"day":0,"time":"1000"}},{"close":{"day":1,"time":"1745"},"open":{"day":1,"time":"1000"}},{"close":{"day":2,"time":"1745"},"open":{"day":2,"time":"1000"}},{"close":{"day":3,"time":"1745"},"open":{"day":3,"time":"1000"}},{"close":{"day":4,"time":"1745"},"open":{"day":4,"time":"1000"}},{"close":{"day":5,"time":"1745"},"open":{"day":5,"time":"1000"}},{"close":{"day":6,"time":"1745"},"open":{"day":6,"time":"1000"}}],"weekday_text":["Monday: 10:00 AM – 5:45 PM","Tuesday: 10:00 AM – 5:45 PM","Wednesday: 10:00 AM – 5:45 PM","Thursday: 10:00 AM – 5:45 PM","Friday: 10:00 AM – 5:45 PM","Saturday: 10:00 AM – 5:45 PM","Sunday: 10:00 AM – 5:45 PM"]},"place_id":"ChIJo9DW6I9YwokR8UjIKmzHkrI","rating":4.8,"url":"https://maps.google.com/?cid=12867566352739092721","utc_offset":-300,"vicinity":"175-208 79th Street Central Park West, New York","website":"http://www.amnh.org/rose/","location":{"lat":40.78154379999999,"lng":-73.97324309999999},"expected_time":54,"lat":40.78154379999999,"lng":-73.97324309999999},"start":"18:11:42","end":"19:05:42"}],[{"poi":{"location":{"lat":40.765068,"lng":-73.987452}}},{"route":"y}xwFvsqbMfM}`@nGaStDuL","departure":"09:46:49","arrival":"10:00:00"},{"poi":{"formatted_address":"1 W 53rd St, New York, NY 10019, USA","formatted_phone_number":"(212) 757-7013","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"37a913d1b1383a74feb58d11d53c80825450452d","international_phone_number":"+1 212-757-7013","name":"Saint Thomas Church Fifth Avenue","place_id":"ChIJQxcQwftYwokRKy-FqagoB7g","rating":4.6,"url":"https://maps.google.com/?cid=13260612332679409451","utc_offset":-300,"vicinity":"1 West 53rd Street, New York","website":"http://www.saintthomaschurch.org/","location":{"lat":40.7608247,"lng":-73.9763978},"expected_time":69,"lat":40.7608247,"lng":-73.9763978},"start":"10:00:00","end":"11:09:00"},{"route":"mdwwFxcnbMyArEuAhECPyB~GgDfKuC`JyDiC_Ak@w@bC","start":"11:09:00","end":"11:21:37"},{"poi":{"formatted_address":"217 E 51st St, New York, NY 10022, USA","formatted_phone_number":"(212) 649-5895","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_recreational-71.png","id":"b2446e6c54413a661d9599177c41fa85e34264b4","international_phone_number":"+1 212-649-5895","name":"Greenacre Park","place_id":"ChIJGaiaEONYwokR68EFhU8zSNc","rating":4.8,"url":"https://maps.google.com/?cid=15512705333104853483","utc_offset":-300,"vicinity":"217 East 51st Street, New York","website":"http://greenacrepark.org/","location":{"lat":40.7562441,"lng":-73.9692882},"expected_time":35,"lat":40.7562441,"lng":-73.9692882},"start":"11:21:37","end":"11:56:37"},{"route":"mdwwFxcnbMnBmG_CyAuFyDkMkIaEmCoBoAcC_Bk@lB","start":"11:56:37","end":"12:09:32"},{"poi":{"formatted_address":"250 E 61st St, New York, NY 10065, USA","formatted_phone_number":"(212) 838-6844","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"167169ebce51adfe9b963c168730ce33e4955b7b","international_phone_number":"+1 212-838-6844","name":"Trinity Baptist Church","place_id":"ChIJ0aaQIeZYwokRyASYeW2fKwI","rating":4.8,"url":"https://maps.google.com/?cid=156393904614671560","utc_offset":-300,"vicinity":"250 East 61st Street, New York","website":"http://tbcny.org/","location":{"lat":40.7619137,"lng":-73.9641061},"expected_time":89,"lat":40.7619137,"lng":-73.9641061},"start":"12:09:32","end":"13:38:32"},{"route":"ajxwFzambMj@mBbC~Al@`@bC|ApIvFxFpDtFxDvNjJ~BxA|A{E","start":"13:38:32","end":"13:54:39"},{"lunch":true,"location":{"lat":40.75272189999999,"lng":-73.9686265},"start":"13:54:39","end":"14:54:39"},{"poi":{"formatted_address":"315 E 47th St, New York, NY 10017, USA","formatted_phone_number":"(212) 753-3401","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"b852b99385d83211f7e045d1eea870e6261a98b8","international_phone_number":"+1 212-753-3401","name":"Church of the Holy Family (The United Nations Parish)","opening_hours":{"open_now":true,"periods":[{"close":{"day":0,"time":"1630"},"open":{"day":0,"time":"0730"}},{"close":{"day":1,"time":"1800"},"open":{"day":1,"time":"0730"}},{"close":{"day":2,"time":"1800"},"open":{"day":2,"time":"0730"}},{"close":{"day":3,"time":"1800"},"open":{"day":3,"time":"0730"}},{"close":{"day":4,"time":"1800"},"open":{"day":4,"time":"0730"}},{"close":{"day":5,"time":"1800"},"open":{"day":5,"time":"0730"}},{"close":{"day":6,"time":"1830"},"open":{"day":6,"time":"0730"}}],"weekday_text":["Monday: 7:30 AM – 6:00 PM","Tuesday: 7:30 AM – 6:00 PM","Wednesday: 7:30 AM – 6:00 PM","Thursday: 7:30 AM – 6:00 PM","Friday: 7:30 AM – 6:00 PM","Saturday: 7:30 AM – 6:30 PM","Sunday: 7:30 AM – 4:30 PM"]},"place_id":"ChIJY7Q_eh1ZwokRpdFTGXaIPoc","rating":4.6,"url":"https://maps.google.com/?cid=9745376684488774053","utc_offset":-300,"vicinity":"315 East 47th Street, New York","website":"http://www.churchholyfamily.org/","location":{"lat":40.75272189999999,"lng":-73.9686265},"expected_time":88,"lat":40.75272189999999,"lng":-73.9686265},"start":"14:54:39","end":"16:22:39"},{"route":"a`vwFnbnbMXw@@E}AcA{CqBa@WIAc@EWEc@K{ApE","start":"16:22:39","end":"16:27:05"},{"poi":{"formatted_address":"777 United Nations Plaza, New York, NY 10017, USA","formatted_phone_number":"(212) 973-1700","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_business-71.png","id":"d019677378f6844636ef19fc169df2c6d8adb9a8","international_phone_number":"+1 212-973-1700","name":"Church Center of the United Nations","place_id":"ChIJi8qu5RxZwokROHK70ZW5XIQ","rating":5,"url":"https://maps.google.com/?cid=9537702163983856184","utc_offset":-300,"vicinity":"777 United Nations Plaza, New York","website":"http://umc-gbcs.org/","location":{"lat":40.7501208,"lng":-73.969297},"expected_time":59,"lat":40.7501208,"lng":-73.969297},"start":"16:27:05","end":"17:26:05"},{"route":"a`vwFnbnbMkJ|YiC~H{BwAITmApDaBnFuAjEeJrY","start":"17:26:05","end":"17:43:40"},{"poi":{"formatted_address":"1166 Avenue of the Americas 16th Floor, New York, NY 10036, USA","formatted_phone_number":"(212) 808-4460","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"9649e699bf5b4206e23c2620caf22ed36de390aa","international_phone_number":"+1 212-808-4460","name":"Redeemer Presbyterian Church Offices","place_id":"ChIJG3veoshYwokR6GrX_-_I_18","rating":4.9,"url":"https://maps.google.com/?cid=6917468485779417832","utc_offset":-300,"vicinity":"1166 Avenue of the Americas 16th Floor, New York","website":"http://www.redeemer.com/","location":{"lat":40.7568777,"lng":-73.9820345},"expected_time":52,"lat":40.7568777,"lng":-73.9820345},"start":"17:43:40","end":"18:35:40"}]];
    res.render('map',{array:pois});
});
