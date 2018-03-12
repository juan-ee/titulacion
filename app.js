const ga = require('ga-tsp');
const KmeansLib = require('kmeans-same-size');
const express = require('express');
const app =  express();
const api = require('./apis');
// const bodyParser = require('body-parser');
// const fs = require('fs');

app.set('view engine', 'ejs');
// app.use(bodyParser.json()); // support json encoded bodies
// app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(express.static('public'));

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
                api.getPois(userInfo.location,2000,userInfo.categories[i],function (results) {
                    resolve(results);
                });
            })
        );
    }
    Promise.all(promises).then(function (results) {
        // results.forEach(function (pois, index, array) {
        //     pois.sort(function(a, b) {
        //         return b.rating - a.rating;
        //     });
        //     array[index] = pois.slice(0,6);
        // });
        pois = pois.concat.apply(pois, results);
        //---------RESOLVER ESTO--------
        pois.sort(function(a, b) {
            return b.rating - a.rating;
        });
        pois = pois.slice(0,userInfo.days*6);
        //-------------------------------
        getDetails(pois,function (pois_details) {
            getClusters(pois_details,userInfo.days,function (clusters) {
                getTours(clusters,userInfo.location,function (tours) {
                    getRestaurants(tours,function (restaurants) {
                        res.render('map',{array:tours,restaurants:restaurants});
                    })
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
        // clusters[index] = cluster.slice(0,6);
        clusters[index].unshift({location:userLocation});
        //------------------------------------
        promises.push(new Promise(function (resolve) {
            api.getTimeMatrix(clusters[index],keys[n],function (matrix) {
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
                pois:clusters[i],
                date:date,
                totalCities:clusters[i].length,
                timeMatrix:matrixes[i],
                mutation_rate: 0.03,
                sizePopulation:clusters[i].length*clusters[i].length,
                totalGenerations:10*clusters[i].length
            };
            tours.push(ga.evolve(parameters));
        }
        callback(tours);
    });
}

function getRestaurants(tours,callback){
    promises = [];
    tours.forEach(function (tour) {
        tour.forEach(function (value) {
            if(value.lunch){
                promises.push(new Promise(
                    function (resolve) {
                        api.getPois(value.location,30,'restaurant',function (result) {
                            resolve(result);
                        });
                    }
                ));
            }
        });
    });
    Promise.all(promises).then(function (restaurants) {
        callback([].concat.apply([],restaurants));
    });
}

app.get('/test',function (req,res) {
    array = [[{"poi":{"location":{"lat":40.765068,"lng":-73.987452}}},{"route":"y}xwFvsqbMvEcO|BxAzBzAtBqG","departure":"09:53:19","arrival":"10:00:00"},{"poi":{"formatted_address":"237 W 51st St, New York, NY 10019, USA","formatted_phone_number":"(212) 541-6300","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"bb4ac2e4ec26910d50f4cf23c1b1bb448d9e63e6","international_phone_number":"+1 212-541-6300","name":"Times Square Church","opening_hours":{"open_now":false,"periods":[{"open":"0800","close":"2000"},null,{"open":"1700","close":"2100"},null,null,{"open":"1730","close":"2100"},null],"weekday_text":["Monday: Closed","Tuesday: 5:00 – 9:00 PM","Wednesday: Closed","Thursday: Closed","Friday: 5:30 – 9:00 PM","Saturday: Closed","Sunday: 8:00 AM – 8:00 PM"]},"place_id":"ChIJVUGHS1ZYwokRx39CH6zNL5M","rating":4.7,"url":"https://maps.google.com/?cid=10605921786623328199","utc_offset":-300,"vicinity":"237 West 51st Street, New York","website":"http://tsc.nyc/","location":{"lat":40.76234169999999,"lng":-73.98393879999999},"expected_time":46,"lat":40.76234169999999,"lng":-73.98393879999999},"start":"10:00","end":"10:46"},{"route":"o}wwF|{qbMTo@b@{A{B}AyFsD{FuDtBqG","start":"10:46","end":"10:53"},{"poi":{"formatted_address":"308 W 46th St, New York, NY 10036, USA","formatted_phone_number":"(212) 246-3540","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"68fe3c195df22960137d461ae69de4bbbc9c70f9","international_phone_number":"+1 212-246-3540","name":"St Luke's Lutheran Church","place_id":"ChIJq8nBDVRYwokRJiahNbQZYcU","rating":5,"url":"https://maps.google.com/?cid=14222677359997298214","utc_offset":-300,"vicinity":"308 West 46th Street, New York","website":"http://www.stlukesnyc.org/","location":{"lat":40.7600066,"lng":-73.98869069999999},"expected_time":74,"lat":40.7600066,"lng":-73.98869069999999},"start":"10:53","end":"12:07"},{"route":"o}wwF|{qbMTo@tEaO`CnAh@aBNg@rGoS","start":"12:07","end":"12:17"},{"poi":{"formatted_address":"1166 Avenue of the Americas 16th Floor, New York, NY 10036, USA","formatted_phone_number":"(212) 808-4460","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"9649e699bf5b4206e23c2620caf22ed36de390aa","international_phone_number":"+1 212-808-4460","name":"Redeemer Presbyterian Church Offices","place_id":"ChIJG3veoshYwokR6GrX_-_I_18","rating":4.9,"url":"https://maps.google.com/?cid=6917468485779417832","utc_offset":-300,"vicinity":"1166 Avenue of the Americas 16th Floor, New York","website":"http://www.redeemer.com/","location":{"lat":40.7568777,"lng":-73.9820345},"expected_time":87,"lat":40.7568777,"lng":-73.9820345},"start":"12:17","end":"13:44"},{"route":"igwwFlspbMrDgLpDkL~BvAfElCtB|AzLdIxH~E","start":"13:44","end":"13:59"},{"lunch":true,"location":{"lat":40.74862309999999,"lng":-73.9820249},"start":"13:59","end":"14:59"},{"poi":{"formatted_address":"209 Madison Ave, New York, NY 10016, USA","formatted_phone_number":"(212) 689-6350","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"4a4028f2a97fbcd31a07e028bd43a1261e0187c5","international_phone_number":"+1 212-689-6350","name":"Church of the Incarnation","place_id":"ChIJEYAOaQdZwokRG8h5-hhSpvc","rating":4.7,"url":"https://maps.google.com/?cid=17845040840737146907","utc_offset":-300,"vicinity":"209 Madison Avenue, New York","website":"http://churchoftheincarnation.org/","location":{"lat":40.74862309999999,"lng":-73.9820249},"expected_time":31,"lat":40.74862309999999,"lng":-73.9820249},"start":"14:59","end":"15:30"},{"route":"kxywFbhqbMx@iCp@d@hAt@jBoGPi@t@{BnBcG~ARbDPfAHFDnBb@z@Xd@L`AXbCfAdChAzDxBbEbCv@XlAj@lCr@zGbBFBBAJQNAHB~@`@d@HhCv@d@VhBr@zCn@|GxAtBd@hDj@dANjAPfAkDnGaSfCcI`An@","start":"15:30","end":"16:07"},{"poi":{"formatted_address":"405 W 59th St, New York, NY 10019, USA","formatted_phone_number":"(212) 265-3495","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"9a21620619374c7cd37052f0318612c6b8c3f48b","international_phone_number":"+1 212-265-3495","name":"The Church of St. Paul the Apostle","place_id":"ChIJC1050FhYwokR_5BJB8M4-bo","rating":4.8,"url":"https://maps.google.com/?cid=13472862170547589375","utc_offset":-300,"vicinity":"405 West 59th Street, New York","website":"http://www.stpaultheapostle.org/","location":{"lat":40.7699132,"lng":-73.985153},"expected_time":45,"lat":40.7699132,"lng":-73.985153},"start":"16:07","end":"16:52"},{"route":"kxywFbhqbM}Kj]wB~GyB~G[tACFhCfBtBvAEL\\RRHh@J~BLbADnAZp@\\F?NIJEvDbCRHr@^vFzDlG~DzE~CNTDB","start":"16:52","end":"17:14"},{"poi":{"formatted_address":"Pier 86, W 46th St & 12th Ave, New York, NY 10036, USA","formatted_phone_number":"(212) 245-0072","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"6bb43beb2047e4db91e332d24782460ccf8194c2","international_phone_number":"+1 212-245-0072","name":"Intrepid Sea, Air & Space Museum","opening_hours":{"open_now":false,"periods":[{"open":"1000","close":"1700"},{"open":"1000","close":"1700"},{"open":"1000","close":"1700"},{"open":"1000","close":"1700"},{"open":"1000","close":"1700"},{"open":"1000","close":"1700"},{"open":"1000","close":"1700"}],"weekday_text":["Monday: 10:00 AM – 5:00 PM","Tuesday: 10:00 AM – 5:00 PM","Wednesday: 10:00 AM – 5:00 PM","Thursday: 10:00 AM – 5:00 PM","Friday: 10:00 AM – 5:00 PM","Saturday: 10:00 AM – 5:00 PM","Sunday: 10:00 AM – 5:00 PM"]},"place_id":"ChIJnxlg1U5YwokR8T90UrZiIwI","rating":4.6,"url":"https://maps.google.com/?cid=154075347467649009","utc_offset":-300,"vicinity":"Pier 86, West 46th Street & 12th Ave, New York","website":"http://www.intrepidmuseum.org/","location":{"lat":40.7645266,"lng":-73.99960759999999},"expected_time":38,"lat":40.7645266,"lng":-73.99960759999999},"start":"17:14","end":"17:52"}],[{"poi":{"location":{"lat":40.765068,"lng":-73.987452}}},{"route":"y}xwFvsqbMUt@{B_B{FsDiK_HqCeBaC_BsCeB}AgA_BiAyBuAoCiBwFwD{FqDcGaEgGcEaGsDmFsDiCaBFe@?g@Mg@GKWWq@g@KE@I@OA]GMCERq@Rg@?ICQ?Q?IBKNA\\ONSNa@NL","departure":"09:29:01","arrival":"10:00:00"},{"poi":{"formatted_address":"175-208 79th Street Central Park West, New York, NY 10024, USA","formatted_phone_number":"(212) 769-5100","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"c413262999f0818e8355b7539ff6eaf8eb6d0550","international_phone_number":"+1 212-769-5100","name":"Rose Center for Earth & Space","opening_hours":{"open_now":false,"periods":[{"open":"1000","close":"1745"},{"open":"1000","close":"1745"},{"open":"1000","close":"1745"},{"open":"1000","close":"1745"},{"open":"1000","close":"1745"},{"open":"1000","close":"1745"},{"open":"1000","close":"1745"}],"weekday_text":["Monday: 10:00 AM – 5:45 PM","Tuesday: 10:00 AM – 5:45 PM","Wednesday: 10:00 AM – 5:45 PM","Thursday: 10:00 AM – 5:45 PM","Friday: 10:00 AM – 5:45 PM","Saturday: 10:00 AM – 5:45 PM","Sunday: 10:00 AM – 5:45 PM"]},"place_id":"ChIJo9DW6I9YwokR8UjIKmzHkrI","rating":4.8,"url":"https://maps.google.com/?cid=12867566352739092721","utc_offset":-300,"vicinity":"175-208 79th Street Central Park West, New York","website":"http://www.amnh.org/rose/","location":{"lat":40.78154379999999,"lng":-73.97324309999999},"expected_time":81,"lat":40.78154379999999,"lng":-73.97324309999999},"start":"10:00","end":"11:21"},{"route":"sgzwFfcpbM\\eAg@]wA_A_KwGkFoDsGgEaOwJuFqDk@|@OPa@Co@fBKGw@i@Cu@","start":"11:21","end":"11:38"},{"poi":{"formatted_address":"3 W 65th St, New York, NY 10023, USA","formatted_phone_number":"(212) 877-6815","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"a3d4fefa1ac2674697e902b47213cc077371bad6","international_phone_number":"+1 212-877-6815","name":"Holy Trinity Lutheran Church","place_id":"ChIJl4xr-fRYwokRvITflUru_ns","rating":4.9,"url":"https://maps.google.com/?cid=8934840714859087036","utc_offset":-300,"vicinity":"3 West 65th Street, New York","website":"http://www.holytrinitynyc.org/","location":{"lat":40.77208590000001,"lng":-73.97945229999999},"expected_time":72,"lat":40.77208590000001,"lng":-73.97945229999999},"start":"11:38","end":"12:50"},{"route":"sgzwFfcpbM\\eAg@]iAu@HU@CDC","start":"12:50","end":"12:52"},{"poi":{"formatted_address":"New York, NY, USA","formatted_phone_number":"(212) 310-6600","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_recreational-71.png","id":"c9bcef33f0cc85eda31f1c7444e9b1a3b82c9a9f","international_phone_number":"+1 212-310-6600","name":"Central Park","opening_hours":{"open_now":true,"periods":[{"open":"0600","close":"0100"},{"open":"0600","close":"0100"},{"open":"0600","close":"0100"},{"open":"0600","close":"0100"},{"open":"0600","close":"0100"},{"open":"0600","close":"0100"},{"open":"0600","close":"0100"}],"weekday_text":["Monday: 6:00 AM – 1:00 AM","Tuesday: 6:00 AM – 1:00 AM","Wednesday: 6:00 AM – 1:00 AM","Thursday: 6:00 AM – 1:00 AM","Friday: 6:00 AM – 1:00 AM","Saturday: 6:00 AM – 1:00 AM","Sunday: 6:00 AM – 1:00 AM"]},"place_id":"ChIJ4zGFAZpYwokRGUGph3Mf37k","rating":4.8,"url":"https://maps.google.com/?cid=13393458397880860953","utc_offset":-300,"vicinity":"New York","website":"http://www.centralparknyc.org/","location":{"lat":40.7828647,"lng":-73.9653551},"expected_time":50,"lat":40.7828647,"lng":-73.9653551},"start":"12:52","end":"13:42"},{"route":"o_|wFjvnbMKZh@^","start":"13:42","end":"13:42"},{"lunch":true,"location":{"lat":40.78132409999999,"lng":-73.9739882},"start":"13:42","end":"14:42"},{"poi":{"formatted_address":"Central Park West & 79th St, New York, NY 10024, USA","formatted_phone_number":"(212) 769-5100","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"d9dd2c58ebb5c5cb4d00b28db933b7e220a34b5a","international_phone_number":"+1 212-769-5100","name":"American Museum of Natural History","opening_hours":{"open_now":false,"periods":[{"open":"1000","close":"1745"},{"open":"1000","close":"1745"},{"open":"1000","close":"1745"},{"open":"1000","close":"1745"},{"open":"1000","close":"1745"},{"open":"1000","close":"1745"},{"open":"1000","close":"1745"}],"weekday_text":["Monday: 10:00 AM – 5:45 PM","Tuesday: 10:00 AM – 5:45 PM","Wednesday: 10:00 AM – 5:45 PM","Thursday: 10:00 AM – 5:45 PM","Friday: 10:00 AM – 5:45 PM","Saturday: 10:00 AM – 5:45 PM","Sunday: 10:00 AM – 5:45 PM"]},"place_id":"ChIJCXoPsPRYwokRsV1MYnKBfaI","rating":4.6,"url":"https://maps.google.com/?cid=11708656934508584369","utc_offset":-300,"vicinity":"Central Park West & 79th St, New York","website":"http://www.amnh.org/","location":{"lat":40.78132409999999,"lng":-73.9739882},"expected_time":34,"lat":40.78132409999999,"lng":-73.9739882},"start":"14:42","end":"15:16"},{"route":"co{wFbkpbMhDsKiCeB}B}AaCwAaG_EwBwA}B{A","start":"15:16","end":"15:26"},{"poi":{"formatted_address":"The Triad Theater, 158 W 72nd St (Second Floor), New York, NY 10023, USA","formatted_phone_number":"(929) 269-4717","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"b8ce58259e9bd5af66b6c5ffc3e295b9c368b4a7","international_phone_number":"+1 929-269-4717","name":"Good Shepherd Anglican Church","opening_hours":{"open_now":false,"periods":[{"open":"1030","close":"1200"},null,null,null,null,null,null],"weekday_text":["Monday: Closed","Tuesday: Closed","Wednesday: Closed","Thursday: Closed","Friday: Closed","Saturday: Closed","Sunday: 10:30 AM – 12:00 PM"]},"place_id":"ChIJfzKKRopYwokRC4wmanWPXaw","rating":5,"url":"https://maps.google.com/?cid=12420241081812552715","utc_offset":-300,"vicinity":"The Triad Theater, 158 W 72nd St (Second Floor), New York","website":"http://www.goodshepnyc.org/","location":{"lat":40.77802399999999,"lng":-73.9809935},"expected_time":74,"lat":40.77802399999999,"lng":-73.9809935},"start":"15:26","end":"16:40"},{"route":"co{wFbkpbM~Le`@k@m@[Q[QUSa@s@kAWKCIMa@s@CCRc@FWWC]U_Ay@u@}AsAsCw@aBTOb@a@Ac@KmAIe@KWA]@o@@]B?J]h@e@PQL_@@e@KgAOwACg@?]FWJ]z@}AX}@?UAUI[U[Dc@Ja@Ta@Po@NSZIPOH[AuABSRo@`A}ARs@BW@YGCm@a@eFiDIE","start":"16:40","end":"17:05"},{"poi":{"formatted_address":"1000 5th Ave, New York, NY 10028, USA","formatted_phone_number":"(212) 535-7710","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"f732f202150af1f14ae8a057a1014ceea6b33fc4","international_phone_number":"+1 212-535-7710","name":"The Metropolitan Museum of Art","opening_hours":{"open_now":false,"periods":[{"open":"1000","close":"1730"},{"open":"1000","close":"1730"},{"open":"1000","close":"1730"},{"open":"1000","close":"1730"},{"open":"1000","close":"1730"},{"open":"1000","close":"2100"},{"open":"1000","close":"2100"}],"weekday_text":["Monday: 10:00 AM – 5:30 PM","Tuesday: 10:00 AM – 5:30 PM","Wednesday: 10:00 AM – 5:30 PM","Thursday: 10:00 AM – 5:30 PM","Friday: 10:00 AM – 9:00 PM","Saturday: 10:00 AM – 9:00 PM","Sunday: 10:00 AM – 5:30 PM"]},"place_id":"ChIJb8Jg9pZYwokR-qHGtvSkLzs","rating":4.8,"url":"https://maps.google.com/?cid=4264808743088595450","utc_offset":-300,"vicinity":"1000 5th Avenue, New York","website":"http://www.metmuseum.org/","location":{"lat":40.7794366,"lng":-73.963244},"expected_time":39,"lat":40.7794366,"lng":-73.963244},"start":"17:05","end":"17:44"}],[{"poi":{"location":{"lat":40.765068,"lng":-73.987452}}},{"route":"y}xwFvsqbM|F_RtBwGPH`Bt@`@TpBhAzBrApCzAtB|@bGcR|FaRr@aCp@uB","departure":"09:40:38","arrival":"10:00:00"},{"poi":{"formatted_address":"5 E 48th St, New York, NY 10017, USA","formatted_phone_number":"(212) 832-8443","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"2194bb8d20bf80ff3e02f1dc788e8d21dd03855b","international_phone_number":"+1 212-832-8443","name":"Church of Sweden","place_id":"ChIJrVAmhP5YwokRLwP4kRU080o","rating":5,"url":"https://maps.google.com/?cid=5400717645395264303","utc_offset":-300,"vicinity":"5 East 48th Street, New York","website":"https://www.svenskakyrkan.se/english","location":{"lat":40.757213,"lng":-73.9773957},"expected_time":72,"lat":40.757213,"lng":-73.9773957},"start":"10:00","end":"11:12"},{"route":"a`vwFnbnbMkJ|YiC~H{FwDwB{AaCwAiAlDaErMwAjE","start":"11:12","end":"11:29"},{"poi":{"formatted_address":"777 United Nations Plaza, New York, NY 10017, USA","formatted_phone_number":"(212) 973-1700","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_business-71.png","id":"d019677378f6844636ef19fc169df2c6d8adb9a8","international_phone_number":"+1 212-973-1700","name":"Church Center of the United Nations","place_id":"ChIJi8qu5RxZwokROHK70ZW5XIQ","rating":5,"url":"https://maps.google.com/?cid=9537702163983856184","utc_offset":-300,"vicinity":"777 United Nations Plaza, New York","website":"http://umc-gbcs.org/","location":{"lat":40.7501208,"lng":-73.969297},"expected_time":56,"lat":40.7501208,"lng":-73.969297},"start":"11:29","end":"12:25"},{"route":"a`vwFnbnbMkJ|YiC~H{BwAITmApDaBnFuAjEcC|HgAs@cDwBoCeBiBqAwA}@sBsAyFwD_Ak@w@bC","start":"12:25","end":"12:48"},{"poi":{"formatted_address":"1 W 53rd St, New York, NY 10019, USA","formatted_phone_number":"(212) 757-7013","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"37a913d1b1383a74feb58d11d53c80825450452d","international_phone_number":"+1 212-757-7013","name":"Saint Thomas Church Fifth Avenue","place_id":"ChIJQxcQwftYwokRKy-FqagoB7g","rating":4.6,"url":"https://maps.google.com/?cid=13260612332679409451","utc_offset":-300,"vicinity":"1 West 53rd Street, New York","website":"http://www.saintthomaschurch.org/","location":{"lat":40.7608247,"lng":-73.9763978},"expected_time":89,"lat":40.7608247,"lng":-73.9763978},"start":"12:48","end":"14:17"},{"route":"w{xwFhsmbMiFpPgCbIzBxAtFtD`BhAr@\\tJrGxFrD|B|Aw@bC","start":"14:17","end":"14:34"},{"poi":{"formatted_address":"128 E 63rd St, New York, NY 10065, USA","formatted_phone_number":"(212) 838-2560","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"047b0d0b5f31ff39a564f061536bcec82efae189","international_phone_number":"+1 212-838-2560","name":"Society of Illustrators","opening_hours":{"open_now":false,"periods":[null,null,{"open":"1000","close":"2000"},{"open":"1000","close":"1700"},{"open":"1000","close":"2000"},{"open":"1000","close":"1700"},{"open":"1100","close":"1700"}],"weekday_text":["Monday: Closed","Tuesday: 10:00 AM – 8:00 PM","Wednesday: 10:00 AM – 5:00 PM","Thursday: 10:00 AM – 8:00 PM","Friday: 10:00 AM – 5:00 PM","Saturday: 11:00 AM – 5:00 PM","Sunday: Closed"]},"place_id":"ChIJYfOLGO9YwokRr_IPu4VTkkQ","rating":4.8,"url":"https://maps.google.com/?cid=4941103575012995759","utc_offset":-300,"vicinity":"128 East 63rd Street, New York","website":"http://www.societyillustrators.org/","location":{"lat":40.7648331,"lng":-73.96683349999999},"expected_time":59,"lat":40.7648331,"lng":-73.96683349999999},"start":"14:34","end":"15:33"},{"route":"ajxwFzambMmCpI_C{A{BwAeBpFUv@MTa@nA","start":"15:33","end":"15:39"},{"poi":{"formatted_address":"250 E 61st St, New York, NY 10065, USA","formatted_phone_number":"(212) 838-6844","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"167169ebce51adfe9b963c168730ce33e4955b7b","international_phone_number":"+1 212-838-6844","name":"Trinity Baptist Church","place_id":"ChIJ0aaQIeZYwokRyASYeW2fKwI","rating":4.8,"url":"https://maps.google.com/?cid=156393904614671560","utc_offset":-300,"vicinity":"250 East 61st Street, New York","website":"http://tbcny.org/","location":{"lat":40.7619137,"lng":-73.9641061},"expected_time":79,"lat":40.7619137,"lng":-73.9641061},"start":"15:39","end":"16:58"},{"route":"ajxwFzambMj@mBbC~Al@`@bC|ApIvFxFpDtFxD~BxAoBlG","start":"16:58","end":"17:11"},{"poi":{"formatted_address":"217 E 51st St, New York, NY 10022, USA","formatted_phone_number":"(212) 649-5895","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_recreational-71.png","id":"b2446e6c54413a661d9599177c41fa85e34264b4","international_phone_number":"+1 212-649-5895","name":"Greenacre Park","place_id":"ChIJGaiaEONYwokR68EFhU8zSNc","rating":4.8,"url":"https://maps.google.com/?cid=15512705333104853483","utc_offset":-300,"vicinity":"217 East 51st Street, New York","website":"http://greenacrepark.org/","location":{"lat":40.7562441,"lng":-73.9692882},"expected_time":50,"lat":40.7562441,"lng":-73.9692882},"start":"17:11","end":"18:01"}]];
    restaurants = [{"geometry":{"location":{"lat":40.75271,"lng":-73.9833371},"viewport":{"northeast":{"lat":40.75410912989273,"lng":-73.98195562010727},"southwest":{"lat":40.75140947010728,"lng":-73.98465527989272}}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png","id":"78d4a370db4b574d5b88eda87443558d9f64bdc3","name":"Chipotle Mexican Grill","opening_hours":{"open_now":false,"weekday_text":[]},"photos":[{"height":2012,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/117490607693266482575/photos\">David W</a>"],"photo_reference":"CmRaAAAAskO8b4AkQjdHtba1sogJ1vJzCapFC--MXLrboY79KfhLNPcGZgZ_9Ps4b0lPUrpM7QA9fqt5SVpvB8Q9RxKgNQJqtLZ46UhzfjZocFD1pXO256RrIIpgLMrTNyZ1--5wEhAJ6DfJXHLy43gVReOBrRPeGhRs8887c1cY_nrhNPmPCpdB2tbxZg","width":3312}],"place_id":"ChIJDS7QgKpZwokRqbN94Ss9uxo","price_level":1,"rating":3.7,"reference":"CmRbAAAAXDcklkKBvgPAmR1XgghKiu9tFXA64WVQ30q1F_vFMFiyv09RixKXk4DzReu3EXogAtvpw8P5oE93hiJlFHM-R21hBVdHzLmbMUHKTxcHOlMtrKwiEu3lsTXih4vzHcaLEhBBVrOgrYdA_hW9xwauSwMgGhSxexOFnr6aBd6Uqu7-VF6JYWT8tg","scope":"GOOGLE","types":["restaurant","food","point_of_interest","establishment"],"vicinity":"28 W 40th St, New York"},{"geometry":{"location":{"lat":40.754538,"lng":-73.98250279999999},"viewport":{"northeast":{"lat":40.75574217989272,"lng":-73.98124932010727},"southwest":{"lat":40.75304252010728,"lng":-73.9839489798927}}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png","id":"bd46c7f5f2917d7af1352e17cdd3cbb7028eb25d","name":"Gabriel Kreuther","opening_hours":{"open_now":false,"weekday_text":[]},"photos":[{"height":1365,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/107389134674463250002/photos\">Gabriel Kreuther</a>"],"photo_reference":"CmRaAAAAXsZ7MyvIcAl20dN10qhD0kiqkqi8v9CegACyqUJVRWLE_Cp5ztasuc659_Z9uEhow5ERf11P4iuyeQMATnBtQkgx6WKMKZUgLAPYFHaSzWUl2qu51XMp5RQn-rGk4U9jEhAGOW_IDNiIieFIpBi31CyDGhSd4q6mqyQFA0Sfhzm9cQCkyEkMag","width":2048}],"place_id":"ChIJw_TGEwBZwokR-zLts543O-4","price_level":3,"rating":4.5,"reference":"CmRbAAAABKH7fhctKk9cow0SqcUywL4xE8vVM73_TlxrycnRErmnPz6YonQDqEeyu5stWALKh8dK9RDLWGsVK3n5ZKsfg2cTxx593YuRL__Xtx0wkZ_UF9Kp0F34N36msDg2U3TWEhCjJ1okeujHtwpMSLFrACyZGhRG12zzBlEsiDjxAxSmeAG538b7_Q","scope":"GOOGLE","types":["restaurant","food","point_of_interest","establishment"],"vicinity":"41 W 42nd St, New York"},{"geometry":{"location":{"lat":40.7552761,"lng":-73.9815071},"viewport":{"northeast":{"lat":40.75668822989272,"lng":-73.98011167010729},"southwest":{"lat":40.75398857010727,"lng":-73.98281132989273}}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png","id":"50ef8111fccb0ec000a00fac8d1ef89552a46e67","name":"Sen Sakana","opening_hours":{"open_now":false,"weekday_text":[]},"photos":[{"height":3036,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/116500773124657848943/photos\">Camilo Paulino</a>"],"photo_reference":"CmRaAAAAeQsjnpnfAJV_FElLA2bDRSK7Z3s3_6tsag4NyiXMHb3k2aMvixyiiCFMJDq0mcnNhlfvue_nxCiT0BWfMfrgHnkFsaXkeYWWKN5Wqrfqirr9abjI4oq-gOcEEe5K-YEyEhAZUHMiJ6cg_LmyvJwPAXXrGhQF-ixXm7weFse9UbAEkSI_xkGEew","width":4048}],"place_id":"ChIJEb9X4P9YwokRQHgAN_yR_58","price_level":3,"rating":4.4,"reference":"CmRbAAAA-AMnzzeVl4I9Zk7l8pHdDETgKEGXo-wSN4t-tlTiOUySTUeeQ37ZaHVaoZYLTKXpvxO3Oj6_hCcapDFFcBfuD_LuNcUj2xIVx0RUAkhkRLntKfavaMM8QBu31LAn5gLTEhD6HPgAfu1yv9G40SVF_R3XGhTZmVqeNS-CNxp7vyoc3y1M5uQQUA","scope":"GOOGLE","types":["restaurant","food","point_of_interest","establishment"],"vicinity":"28 W 44th St, New York"},{"geometry":{"location":{"lat":40.7552982,"lng":-73.9806899},"viewport":{"northeast":{"lat":40.75657062989273,"lng":-73.97939677010729},"southwest":{"lat":40.75387097010728,"lng":-73.98209642989272}}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png","id":"e72590ebc0a5a69f51b2b1c7c20b3266b94a03ac","name":"Strip House","opening_hours":{"open_now":false,"weekday_text":[]},"photos":[{"height":500,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/111463267452487797123/photos\">Strip House</a>"],"photo_reference":"CmRaAAAA9ipNjWjnr-Cw2fPrjVpLJxgfJwdzqTINFfGgtCLg9tG-TmNfRuZZbgUsUm2Z7YtbSN1uPJdcSGv4HpV9duJ8BREHOMAA74tX8PaP9yRDXs1hHw9vq19PD6DqfqDdU-IzEhBrVj02E4rMSnAymgRmNTwMGhTHvuYm8WJLXL0_JnPaf4-B3zxNYw","width":500}],"place_id":"ChIJpeX32v9YwokRb9hCErfiyVk","price_level":2,"rating":4.3,"reference":"CmRbAAAADaBKKAT9baQ7jisfaRGysIBhPQ28y_K9T2gLyo8aJbWFLVfvfwYHgJdBBulCgXyCLk9gr507Ue3UZgirUMQDUFs2KBRqU2jvKgdmpk5F3Rwo286_swljjXZEnQ5RE_F-EhAkCG1CFP66hzGbt6OHMl2mGhToznzIoA_sFC1gkFXhZXQ_X6YOgA","scope":"GOOGLE","types":["restaurant","food","point_of_interest","establishment"],"vicinity":"15 W 44th St, New York"},{"geometry":{"location":{"lat":40.7548095,"lng":-73.9851819},"viewport":{"northeast":{"lat":40.75599232989272,"lng":-73.98342642010726},"southwest":{"lat":40.75329267010727,"lng":-73.98612607989271}}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png","id":"734c890da209a73908a1981618555a1165fbc332","name":"DaDong","opening_hours":{"open_now":false,"weekday_text":[]},"photos":[{"height":870,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/117838760736315175092/photos\">A Google User</a>"],"photo_reference":"CmRaAAAAeYc3WF_qVEgwnkfpN6ec7ccHtxzfH4W1_3TdIlJ_hNfkgzeLFnyOrfwpl3U3OZyGglT6tzbr8LEFElYDUPeE3CIKuC386A-ee6iLgpdi6tcE5dpoBDRSxkaxfGvQ-kc1EhAU_f9XqfCdqt0B2vx0UPG_GhTKIkywgKlIE81uc2VAj7jvZaxskg","width":1346}],"place_id":"ChIJVQck0KpZwokRh_uOtmlngzs","price_level":3,"rating":2.9,"reference":"CmRbAAAACKFLl0WPKZ3i40imV9NA5FAeYjLKT01Q1dQli7f_ItYyr9kkS9yI4Zfn8N-5s3rGWAGZ0eUNfhW8n-SKzXkEFMQ10zCffG9i2ZsIs0lUmn8UJTfhnQNDKyqA1vR3iwaWEhCeEfmMITHtpVx56IDIVqYnGhQ35G_1FFs_cDyRNEsxK4D_9VJnYA","scope":"GOOGLE","types":["restaurant","food","point_of_interest","establishment"],"vicinity":"3 Bryant Park, New York"},{"geometry":{"location":{"lat":40.7539944,"lng":-73.9815586},"viewport":{"northeast":{"lat":40.75525472989273,"lng":-73.98026362010728},"southwest":{"lat":40.75255507010728,"lng":-73.98296327989272}}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png","id":"83e205175e30c692a38acc1ea766de36594cedd0","name":"Chipotle Mexican Grill","opening_hours":{"open_now":false,"weekday_text":[]},"photos":[{"height":2012,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/117490607693266482575/photos\">David W</a>"],"photo_reference":"CmRaAAAAYk1idrOSddddD4SesY-YU5O74td_ETA8zVqTCMW23iKRxo77CJLxV0CHhdxtcEEDsgwd4NxyGn9FHqyAD1APl5xc9qdCQePBXbQTxZMth8tQfbX64__VIDZaN0SQC-hMEhDOZ37FxAUYtR14c-RYsMngGhR8zmvNSnWWE3abLJ_pigrYRt62bA","width":3312}],"place_id":"ChIJReNURwBZwokRj2Il7Drid9U","price_level":1,"rating":3.9,"reference":"CmRbAAAAQdFOec4pTGQB8CPnZswx32UofMXOeZw_6ighsWH59WVXXWkmMQ2H6JOixPqenOCKWqutm0HcHtrsBqCYzG50KL4eQ51mSmLTfpRWMEEptYXmoNKE3IRrQ9R75bnyHew5EhC0jBCjgrYW1pzem_V2cblpGhTPo-nAC74h1gbUrxIsGpgB4Zc4UA","scope":"GOOGLE","types":["restaurant","food","point_of_interest","establishment"],"vicinity":"9 W 42nd St, New York"},{"geometry":{"location":{"lat":40.7521694,"lng":-73.9841356},"viewport":{"northeast":{"lat":40.75351922989272,"lng":-73.98278577010728},"southwest":{"lat":40.75081957010728,"lng":-73.98548542989273}}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png","id":"bd7b3b1285ffd247e1018dc0697291373e427144","name":"SUBWAY","opening_hours":{"open_now":true,"weekday_text":[]},"photos":[{"height":486,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/106940742610026377389/photos\">A Google User</a>"],"photo_reference":"CmRaAAAAkuWF5uz7JTbN3prw9mdDl7u7K-Rlq2Mo_mEwyWPrxuBHVS62HlLnPdPvoBmZCdE-rUy-a9zLXJGg48ihkDS5OBd4pkzBzPLPO-qp7m2-IsQEJZ34fksB-4--DyOo-oFpEhB1NpM7nvpZ_ngLcYnI-vERGhRHmpBwb34Bxe1cBSp-ciOrurmskg","width":680}],"place_id":"ChIJTQ8_b6pZwokRUop6v6X0mPM","price_level":1,"rating":3.3,"reference":"CmRbAAAAMyGGdanFpBK3UsfVlsLBTgi8vecyTU2m0Ll_DcI5Sk33E_-fabDmV5PkAG8qkKkH1GnpkZNCbP4n_lLxO7WveXcVdc3FcM8H00ViH0Pc6IvCuyfx8bBPxwl_t-koPFTZEhA9BmcHaP9CIvEe9uccR3upGhR6Kj3DlLALmunszZhht71LJiFDZA","scope":"GOOGLE","types":["restaurant","food","point_of_interest","establishment"],"vicinity":"32 W 39th St, New York"},{"geometry":{"location":{"lat":40.7549514,"lng":-73.98189049999999},"viewport":{"northeast":{"lat":40.75630122989272,"lng":-73.98054067010727},"southwest":{"lat":40.75360157010728,"lng":-73.98324032989272}}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png","id":"965b3ae27e9015f9c98bcb413a8b66981e71e5b9","name":"Subway","opening_hours":{"open_now":false,"weekday_text":[]},"photos":[{"height":2842,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/107841041949837625886/photos\">Stephan Betz</a>"],"photo_reference":"CmRaAAAAOgcl5IsIXehzO3SV9XNy3n-oTdzY65drjy1vZ7nX9jLfHu0XONsqO3HeeI3WGdz0vXRiGZsTeZiSsAnCYkl1QOZNSAgIIMvQp01VNocQTomT3D_GhI9FTPNOYjhdFaB5EhCGGVCQibE5voG-skoySqwQGhR1yG6ExPHRTZ-5Rff82fiZQrbvfQ","width":4147}],"place_id":"ChIJvYe4HQBZwokR0QlZq35d-aU","price_level":1,"rating":2.4,"reference":"CmRbAAAAd05Ewfoh53cefJAnc3lf33V8f8DOQnwotT5rXr5EQgXRHJE1HYmyVrX25aFLjcMiLUSFOo8QATi_udGOVtUuM_JfWhMnehubr773VZLyq1gp__aGo4Y9zNtDXkFbh2sAEhBsFGVIPDuHCVrd9rs9FnzDGhTeiSHofUDW_-cE6YbH5HpXAGEdVw","scope":"GOOGLE","types":["restaurant","food","point_of_interest","establishment"],"vicinity":"31 W 43rd St, New York"},{"geometry":{"location":{"lat":40.7576057,"lng":-73.97831409999999},"viewport":{"northeast":{"lat":40.75888207989272,"lng":-73.97679872010727},"southwest":{"lat":40.75618242010727,"lng":-73.9794983798927}}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_business-71.png","id":"ff31a4f25d6fbda8cf2eb39798ebdb5e1634b5d9","name":"Patina Restaurant Group","place_id":"ChIJyxv9kv5YwokRFm_--decuKo","reference":"CmRbAAAAfhdkr5wbmM1-24gbBVfQxoRchj8lSZQQhZY6YYV_WGrrCbwnql8R0WokSLGaoP1AcE8nP-d71fcu7nuqnqMbnUi7b9J-uzCQp3yemutvsOge7Hu_kk-KfTsZ3yXHZHtoEhCCvKgJhrt9m0N1CxpBmbUbGhSWZSbrIofZ-aWD1yj2V82PdI0XRw","scope":"GOOGLE","types":["restaurant","food","point_of_interest","establishment"],"vicinity":"600 5th Ave #6, New York"},{"geometry":{"location":{"lat":40.7577252,"lng":-73.9780437},"viewport":{"northeast":{"lat":40.75903097989272,"lng":-73.97659457010727},"southwest":{"lat":40.75633132010727,"lng":-73.97929422989272}}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png","id":"ed049fa8fe229f84a4cb4c541e16b27777d52fa0","name":"TGI Fridays","opening_hours":{"open_now":false,"weekday_text":[]},"photos":[{"height":600,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/111379156851169365617/photos\">TGI Fridays</a>"],"photo_reference":"CmRaAAAARaShsgWRUJBKixTCMRUrHBlkbubyL8CnU8lU7RjHv71vy3FNgBPHFdV1y7jLgiOuUKanirmmcuQE7XNXrWRT2UW1fqMnrw4AxM18fQfWTWMqqph64OJvlzRvrDSzIUi6EhA_5jdG2uPSAzjDKeKjxP_2GhRVTBm7HYW56DiHmFAaV_EWlm3Bbg","width":600}],"place_id":"ChIJn7c5kf5YwokRyQeEFVHOgN4","price_level":2,"rating":2.6,"reference":"CmRbAAAA9k1rriyXmI1qMFxCpxlMlrcF78A9YyoEkqeWGttk_M2ilOBscJLzAR520XllVEbxBw70-xlzg2lRl2UriRNFMj71I9E8eWp3ieGh802jo3lo-WR83yOm0txiCNZcLyYXEhCJwOiNi0ywOz3GDkMLLr48GhRvaiMQxZE-UwRdJbGhUbW_cbRU_w","scope":"GOOGLE","types":["restaurant","bar","food","point_of_interest","establishment"],"vicinity":"604 5th Ave, New York"},{"geometry":{"location":{"lat":40.7572196,"lng":-73.9763304},"viewport":{"northeast":{"lat":40.75852297989271,"lng":-73.97487847010729},"southwest":{"lat":40.75582332010727,"lng":-73.97757812989273}}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png","id":"cfa8b04b6131b5ac0603c55df3350db4160b3834","name":"Ja Restaurant Associates","photos":[{"height":4128,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/108893304039939190237/photos\">maria del pilar rincon acevedo</a>"],"photo_reference":"CmRaAAAA_M--tr_t0IFIc4hXAGqIZMHgKcATfYQiz6BFhv8eC5QqRR2aEZr7JG9tKb4iQeIFDUnAJmRw3vJhkZlABESrjVBnd4X77aCIvW-8MsWgP2eBSS9ZIJ1l8LxeUXRC04veEhBSseyvyy4Bm1F7yNKZ0Z_gGhQwITP1w2xxWKkhKjE1LyVed40dZw","width":2322}],"place_id":"ChIJkW0InftYwokRgElP8ysXrdk","rating":3.7,"reference":"CmRbAAAATRr5mvJoL1Gh7Bj21REVP6uV7wEFWdHgj_4VutuSDEhJEFEnEwuMMRDJJO5WhLKRkGO5-Td3wxYsy3H7qzaCRe_fnrmfBwPObuiqmU7PVITLUhooJS1UeZ2pEIBdDo4fEhDnOjPsIjhPhgut-UCZyBIRGhS5ELTfgGLCP2f55nbR1BjRudXGBw","scope":"GOOGLE","types":["restaurant","food","point_of_interest","establishment"],"vicinity":"424 Madison Ave, New York"},{"geometry":{"location":{"lat":40.7554512,"lng":-73.97921079999999},"viewport":{"northeast":{"lat":40.75683792989272,"lng":-73.97794922010726},"southwest":{"lat":40.75413827010728,"lng":-73.98064887989271}}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png","id":"8311792109079e627b0d2be0b54af924d92198e6","name":"Tommy Bahama","opening_hours":{"open_now":false,"weekday_text":[]},"photos":[{"height":953,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/116328682135597130625/photos\">A Google User</a>"],"photo_reference":"CmRaAAAAA3bbfnL__piqliWAJMD0K-LpP_PmGOGFF6RR8QbkrmdVUWltKmv0RfoP5eRTS9OFEI2TP5jMjN7FergpbHLvbL8prFTq4c54M8VHhPYODUIvB1Iws1ln74Y9K4ufMJ5eEhA7JJCgg18V2LlOnO0W8BJTGhQMUf0Bjfcifz_k4-PMULaMnSWonA","width":1277}],"place_id":"ChIJ5ZYmOv5YwokRAD6rtfLf-tM","price_level":3,"rating":4.4,"reference":"CmRbAAAA_ZqTSF2ZBSKoLdZNbu6fvbDEykaj5woDv62CpI7x7XWj6OGM6-mWySnjlIMEduyQSXMigU0OSVSlL_zMZuHBhqunkmEGuUX9iWv-Exbkkh-FLfAn9zXuTWyxv_L9sEbeEhCWvBbeeAmqTKVsuxWtkYhYGhTKxBc3cQ21ybv06ytquqoDUtcJmQ","scope":"GOOGLE","types":["bar","clothing_store","store","restaurant","food","point_of_interest","establishment"],"vicinity":"551 5th Ave, New York"},{"geometry":{"location":{"lat":40.759273,"lng":-73.97566300000001},"viewport":{"northeast":{"lat":40.76072502989273,"lng":-73.97425157010727},"southwest":{"lat":40.75802537010728,"lng":-73.97695122989272}}},"icon":"https://maps.gstatic.com/mapfiles/place_api/icons/restaurant-71.png","id":"5e630bd083148f3b6034366f8e2a76d74ad2b886","name":"Fig & Olive","opening_hours":{"open_now":false,"weekday_text":[]},"photos":[{"height":682,"html_attributions":["<a href=\"https://maps.google.com/maps/contrib/102826416831088353054/photos\">FIG &amp; OLIVE</a>"],"photo_reference":"CmRaAAAA0jreYRPmyLEusznafHFEehMhnFnK_6Xw9Csh0IsKLiNVF5Ssqist2zkr2RxfP-PzlyX03z5_DfiowNRFZjOviLHXnkEZpMR7lk5WAuMwArfXcXDHBzKAGj7_vkwnZQ1jEhA6ar0yEnS2vWkVWM8lSzITGhRx0KZlZ2w9gYhMc_VSFtZphuRcGw","width":1024}],"place_id":"ChIJZbgM8_tYwokRFnNjm92tco0","price_level":3,"rating":4.2,"reference":"CmRbAAAA9AD6ibWm44STwSSMu7QwkCerC3DweZReUpzb53c8V5zfXaWiTSxLLaQmgEY6i_yRftFTel5FS8zcrn3YUPOyEHRSwsAS_0gJstcdv678al4QaHbMtBdYJQzoutNMBiQQEhAmhXdKNYCQnQDz_iURuDyUGhT1V4-NS7B3FE7UEaFJcRNOU_uoGA","scope":"GOOGLE","types":["restaurant","food","point_of_interest","establishment"],"vicinity":"10 E 52nd St, New York"}];

    res.render('map',{array:array ,restaurants:restaurants});

});