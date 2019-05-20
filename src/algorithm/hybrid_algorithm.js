const KmeansLib = require("kmeans-same-size");
const kmeans = new KmeansLib();
const api = require("../api/google_api");
const { of, from, forkJoin } = require("rxjs");
const { GeneticAlgorithm } = require("ga-tsp");
const { get, isNil } = require("lodash");
const moment = require("moment");
const {
  map,
  mergeMap,
  reduce,
  concatMap,
  scan,
  takeWhile,
  switchMap,
  filter
} = require("rxjs/operators");

require("dotenv").config();

function main(userInfo) {
    const tours = [[{"type":"home","location":{"lat":-0.20749,"lng":-78.496901}},{"type":"route","duration":33.916666666666664,"points":"pog@~lb~Mv@f@`@JVPe@~@r@jELfAp@tDfBh@FBGT~DhAIPVHtBj@l@LfAf@zAx@dCrAhCtA`Bx@|B`A|BdAp@d@fFpDd@^p@j@PLHPdA`A|@x@RXR^Nr@^`Cd@fB`AjDl@tAl@nAb@n@v@`BC@i@n@cAnAwArC{ChEu@fAjBzA","schedule":{"start":"08:26","end":"09:00"}},{"type":"poi","formatted_address":"Quito 170401, Ecuador","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"cd183b9104466d07612f04fcdc5e9d8896ee3803","name":"Museo de Arte Colonial","opening_hours":{"open_now":false,"periods":[null,null,{"open":"0930","close":"1700"},{"open":"0930","close":"1700"},{"open":"0930","close":"1700"},{"open":"0930","close":"1700"},{"open":"0930","close":"1700"}],"weekday_text":["lunes: Cerrado","martes: 9:30–17:00","miércoles: 9:30–17:00","jueves: 9:30–17:00","viernes: 9:30–17:00","sábado: 9:30–17:00","domingo: Cerrado"]},"place_id":"ChIJQUt_pyma1ZERn1tRcceDy1A","plus_code":{"compound_code":"QFJP+WQ Centro Histórico, Quito, Ecuador","global_code":"67F3QFJP+WQ"},"rating":4.5,"url":"https://maps.google.com/?cid=5821891835929385887","user_ratings_total":86,"utc_offset":-300,"vicinity":"Ecuador","location":{"lat":-0.2176554,"lng":-78.5130483},"expected_time":51,"schedule":{"start":"09:00","end":"09:51"}},{"type":"route","duration":8.033333333333333,"points":"jfj@dbf~MeAw@h@u@^_@{BiB]YMNoAtAEDG?yBmAu@e@WWeBeBcDkC","schedule":{"start":"09:51","end":"09:59"}},{"type":"poi","formatted_address":"Cuenca N1-41 y, Quito 170401, Ecuador","formatted_phone_number":"(02) 228-0772","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"4aaf4c90522882dbad3f19249b4297be1770561a","international_phone_number":"+593 2-228-0772","name":"Museo de Arte Precolombino Casa del Alabado","opening_hours":{"open_now":false,"periods":[{"open":"0900","close":"1730"},{"open":"0900","close":"1730"},{"open":"0900","close":"1730"},{"open":"1330","close":"1730"},{"open":"0900","close":"1730"},{"open":"0900","close":"1730"},{"open":"0900","close":"1730"}],"weekday_text":["lunes: 9:00–17:30","martes: 9:00–17:30","miércoles: 13:30–17:30","jueves: 9:00–17:30","viernes: 9:00–17:30","sábado: 9:00–17:30","domingo: 9:00–17:30"]},"place_id":"ChIJDYz5wICZ1ZERzgHFEKiSWL4","plus_code":{"compound_code":"QFHM+FM Quito, Ecuador","global_code":"67F3QFHM+FM"},"rating":4.7,"url":"https://maps.google.com/?cid=13715873915690353102","user_ratings_total":318,"utc_offset":-300,"vicinity":"Cuenca N1-41 y, Quito","website":"http://alabado.org/","location":{"lat":-0.2212529999999999,"lng":-78.515811},"expected_time":56,"schedule":{"start":"09:59","end":"10:55"}},{"type":"route","duration":3.5166666666666666,"points":"jfj@dbf~MeAw@h@u@^_@jBsBFKyBmB","schedule":{"start":"10:55","end":"10:58"}},{"type":"poi","formatted_address":"Quito 170401, Ecuador","formatted_phone_number":"(02) 393-8600","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"1ca8f3491ffaaf8e300e647f4e456aa0ea5cc1da","international_phone_number":"+593 2-393-8600","name":"Museo Numismático - Banco Central del Ecuador","opening_hours":{"open_now":false,"periods":[{"open":"1000","close":"1600"},null,{"open":"0900","close":"1700"},{"open":"0900","close":"1700"},{"open":"0900","close":"1700"},{"open":"0900","close":"1700"},{"open":"1000","close":"1600"}],"weekday_text":["lunes: Cerrado","martes: 9:00–17:00","miércoles: 9:00–17:00","jueves: 9:00–17:00","viernes: 9:00–17:00","sábado: 10:00–16:00","domingo: 10:00–16:00"]},"place_id":"ChIJMzNgviua1ZERr1TwaRb82R8","plus_code":{"compound_code":"QFHP+FF Centro Histórico, Quito, Ecuador","global_code":"67F3QFHP+FF"},"rating":4.3,"url":"https://maps.google.com/?cid=2295142658318816431","user_ratings_total":65,"utc_offset":-300,"vicinity":"Quito","website":"https://numismatico.bce.fin.ec/","location":{"lat":-0.2212985,"lng":-78.5138412},"expected_time":80,"schedule":{"start":"10:58","end":"12:18"}},{"type":"route","duration":0.5166666666666667,"points":"rdj@xte~Mt@n@","schedule":{"start":"12:18","end":"12:19"}},{"type":"poi","formatted_address":"García Moreno N10-43, Quito 170401, Ecuador","formatted_phone_number":"(02) 258-4175","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"ba542e4e6705292b08f4da41b8381189c373871b","international_phone_number":"+593 2-258-4175","name":"Iglesia de la Compañía de Jesús","opening_hours":{"open_now":false,"periods":[{"open":"1000","close":"1800"},{"open":"1000","close":"1800"},{"open":"1000","close":"1800"},{"open":"1000","close":"1800"},{"open":"1000","close":"1800"},{"open":"1000","close":"1800"},{"open":"1000","close":"1800"}],"weekday_text":["lunes: 10:00–18:00","martes: 10:00–18:00","miércoles: 10:00–18:00","jueves: 10:00–18:00","viernes: 10:00–18:00","sábado: 10:00–18:00","domingo: 10:00–18:00"]},"place_id":"ChIJVVYLQYeZ1ZER-n8HUtzs_lQ","plus_code":{"compound_code":"QFHP+MC Centro Histórico, Quito, Ecuador","global_code":"67F3QFHP+MC"},"rating":4.8,"url":"https://maps.google.com/?cid=6124592974283636730","user_ratings_total":830,"utc_offset":-300,"vicinity":"García Moreno N10-43, Quito","location":{"lat":-0.2207706,"lng":-78.5138984},"expected_time":40,"schedule":{"start":"12:19","end":"12:59"}},{"type":"route","duration":0.8333333333333334,"points":"rdj@xte~MvAlA","schedule":{"start":"12:59","end":"12:59"}},{"type":"lunch","duration":60,"schedule":{"start":"12:59","end":"13:59"}},{"type":"poi","formatted_address":"760, García Moreno, Quito 170401, Ecuador","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"42724f1738d353cfb92a99f7ddc6ccd52f18a150","name":"Museum Of Maria Augusta Urrutia","opening_hours":{"open_now":false,"periods":[{"open":"0930","close":"1730"},null,{"open":"1000","close":"1800"},{"open":"1000","close":"1800"},{"open":"1000","close":"1800"},{"open":"1000","close":"1800"},{"open":"0930","close":"1730"}],"weekday_text":["lunes: Cerrado","martes: 10:00–18:00","miércoles: 10:00–18:00","jueves: 10:00–18:00","viernes: 10:00–18:00","sábado: 9:30–17:30","domingo: 9:30–17:30"]},"place_id":"ChIJgT1rNiia1ZERMJOiHS85FnI","plus_code":{"compound_code":"QFHP+9C Centro Histórico, Quito, Ecuador","global_code":"67F3QFHP+9C"},"rating":4.6,"url":"https://maps.google.com/?cid=8220821044334859056","user_ratings_total":7,"utc_offset":-300,"vicinity":"760, García Moreno, Quito","location":{"lat":-0.2215442,"lng":-78.5139068},"expected_time":56,"schedule":{"start":"13:59","end":"14:55"}},{"type":"route","duration":0.8833333333333333,"points":"jgj@fwe~MvApA","schedule":{"start":"14:55","end":"14:56"}},{"type":"poi","formatted_address":"Simon Bolivar, Quito 170130, Ecuador","formatted_phone_number":"(02) 393-8600","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"4ee5a4c640c43c408e95c2e7a76dbfb45a639ba9","international_phone_number":"+593 2-393-8600","name":"Museo Numismático - Bco Central del Ecuador","opening_hours":{"open_now":false,"periods":[{"open":"1000","close":"1600"},null,{"open":"0900","close":"1700"},{"open":"0900","close":"1700"},{"open":"0900","close":"1700"},{"open":"0900","close":"1700"},{"open":"1000","close":"1600"}],"weekday_text":["lunes: Cerrado","martes: 9:00–17:00","miércoles: 9:00–17:00","jueves: 9:00–17:00","viernes: 9:00–17:00","sábado: 10:00–16:00","domingo: 10:00–16:00"]},"place_id":"ChIJa7bvLoeZ1ZERWidnW9-8FyY","plus_code":{"compound_code":"QFHP+GF Centro Histórico, Quito, Ecuador","global_code":"67F3QFHP+GF"},"rating":4.7,"url":"https://maps.google.com/?cid=2744870165402822490","user_ratings_total":136,"utc_offset":-300,"vicinity":"Simon Bolivar, Quito","website":"https://numismatico.bce.fin.ec/","location":{"lat":-0.2212052,"lng":-78.5138142},"expected_time":77,"schedule":{"start":"14:56","end":"16:13"}},{"type":"route","duration":1.7333333333333334,"points":"foj@f~e~MoAiAsAcA","schedule":{"start":"16:13","end":"16:15"}},{"type":"poi","formatted_address":"García Moreno, Quito 170405, Ecuador","formatted_phone_number":"(02) 228-2883","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"8c7e084d4945be46d983e1dc2267beb855141e19","international_phone_number":"+593 2-228-2883","name":"Museo de la Ciudad","opening_hours":{"open_now":false,"periods":[{"open":"0900","close":"1700"},null,{"open":"0900","close":"1700"},{"open":"0900","close":"1700"},{"open":"0900","close":"1700"},{"open":"0900","close":"1700"},{"open":"0900","close":"1700"}],"weekday_text":["lunes: Cerrado","martes: 9:00–17:00","miércoles: 9:00–17:00","jueves: 9:00–17:00","viernes: 9:00–17:00","sábado: 9:00–17:00","domingo: 9:00–17:00"]},"place_id":"ChIJowFEM4GZ1ZERbNDPu6GrXbw","plus_code":{"compound_code":"QFGM+VX Quito, Ecuador","global_code":"67F3QFGM+VX"},"rating":4.6,"url":"https://maps.google.com/?cid=13573193563093586028","user_ratings_total":709,"utc_offset":-300,"vicinity":"García Moreno, Quito","website":"http://www.museociudadquito.gob.ec/","location":{"lat":-0.2228231,"lng":-78.5150173},"expected_time":54,"schedule":{"start":"16:15","end":"17:09"}},{"type":"route","duration":4.416666666666667,"points":"foj@f~e~MoAiAgFkEbCiCVR","schedule":{"start":"17:09","end":"17:13"}},{"type":"poi","formatted_address":"Venezuela, Quito 170401, Ecuador","formatted_phone_number":"(02) 295-2860","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"69a51093950c5da82c57c70e3a1482d1f98a828d","international_phone_number":"+593 2-295-2860","name":"Museo Casa de Sucre","opening_hours":{"open_now":false,"periods":[{"open":"0900","close":"1730"},{"open":"0800","close":"1630"},{"open":"0800","close":"1630"},{"open":"0800","close":"1630"},{"open":"0800","close":"1630"},{"open":"0800","close":"1630"},{"open":"0900","close":"1730"}],"weekday_text":["lunes: 8:00–16:30","martes: 8:00–16:30","miércoles: 8:00–16:30","jueves: 8:00–16:30","viernes: 8:00–16:30","sábado: 9:00–17:30","domingo: 9:00–17:30"]},"place_id":"ChIJzYIcHIeZ1ZERZTbKcU8Yl18","plus_code":{"compound_code":"QFHP+7P Centro Histórico, Quito, Ecuador","global_code":"67F3QFHP+7P"},"rating":4.5,"url":"https://maps.google.com/?cid=6888000884577023589","user_ratings_total":305,"utc_offset":-300,"vicinity":"Venezuela, Quito","location":{"lat":-0.2218734,"lng":-78.5132382},"expected_time":67,"schedule":{"start":"17:13","end":"18:20"}}],[{"type":"home","location":{"lat":-0.20749,"lng":-78.496901}},{"type":"route","duration":16.216666666666665,"points":"pog@~lb~Mv@f@_@|@c@t@Wn@kAbCaAhBSXc@`@}@`@iEvAiBn@uDvNK`@sA[i@vBk@IkDcAe@Ea@?Cs@Y}@OO","schedule":{"start":"08:43","end":"09:00"}},{"type":"poi","formatted_address":"&, Av. América &, Av. Universitaria, Quito 170129, Ecuador","formatted_phone_number":"(02) 321-6335","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"37e1ecf70d43439ce4a8a9d7c864e54e0bc0d4f3","international_phone_number":"+593 2-321-6335","name":"Museo de la Universidad Central del Ecuador \"MUCE\"","opening_hours":{"open_now":false,"periods":[null,{"open":"0800","close":"1600"},{"open":"0800","close":"1600"},{"open":"0800","close":"1600"},{"open":"0800","close":"1600"},{"open":"0800","close":"1600"},null],"weekday_text":["lunes: 8:00–16:00","martes: 8:00–16:00","miércoles: 8:00–16:00","jueves: 8:00–16:00","viernes: 8:00–16:00","sábado: Cerrado","domingo: Cerrado"]},"place_id":"ChIJu1lTQj-a1ZERXSgEWcGusyE","plus_code":{"compound_code":"QFXX+J3 Miraflores, Quito, Ecuador","global_code":"67F3QFXX+J3"},"rating":4,"url":"https://maps.google.com/?cid=2428476769528195165","user_ratings_total":11,"utc_offset":-300,"vicinity":"&, Av. América &, Avenida Universitaria, Quito","website":"https://www.facebook.com/museouniversitario.muce","location":{"lat":-0.2009745,"lng":-78.50226719999999},"expected_time":89,"schedule":{"start":"09:00","end":"10:29"}},{"type":"route","duration":39.416666666666664,"points":"rlb@loa~MvAtCh@p@fFv@~El@o@zBXHb@Hf@D`AEdC}@TIj@fAhAxBj@v@HAN@JDJFJN@L\\@j@FtA^bIhCvE`BtDlA`M`EpFjB|C`AdC`AbCj@hEbAo@pAAd@iAzGdB\\n@RrBt@p@\\n@ZLRLf@\\`@f@Xp@\\NANG@CDOT[h@[~@W~@E|AECs@Y}@OO","schedule":{"start":"10:29","end":"11:08"}},{"type":"poi","formatted_address":"Teresa De Cepeda, Quito 170147, Ecuador","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_recreational-71.png","id":"127cd6934574d70e1167efc2fd7c7bffe98b227a","name":"Parque Teresa de Cepeda","opening_hours":{"open_now":true,"periods":[{"open":"0600","close":"2200"},{"open":"0600","close":"2200"},{"open":"0600","close":"2200"},{"open":"0600","close":"2200"},{"open":"0600","close":"2200"},{"open":"0600","close":"2200"},{"open":"0600","close":"2200"}],"weekday_text":["lunes: 6:00–22:00","martes: 6:00–22:00","miércoles: 6:00–22:00","jueves: 6:00–22:00","viernes: 6:00–22:00","sábado: 6:00–22:00","domingo: 6:00–22:00"]},"place_id":"ChIJ____Koqa1ZERV0a2-AldYeA","plus_code":{"compound_code":"RG95+H2 Rumipamba, Quito, Ecuador","global_code":"67F3RG95+H2"},"rating":4.1,"url":"https://maps.google.com/?cid=16168306434645575255","user_ratings_total":208,"utc_offset":-300,"vicinity":"Teresa De Cepeda, Quito","location":{"lat":-0.181054,"lng":-78.4924202},"expected_time":63,"schedule":{"start":"11:08","end":"12:11"}},{"type":"route","duration":18.716666666666665,"points":"n`d@xia~MyGqBcCy@kDcAAGCAECGAE@e@_@qAgEe@qAgC~@g@Lo@Lo@R}@VqBl@kBl@aKhDGFs@Ts@\\tBpEl@nA","schedule":{"start":"12:11","end":"12:30"}},{"type":"poi","formatted_address":"Inglaterra, Quito 170515, Ecuador","formatted_phone_number":"(02) 222-7847","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"a9a552de758780c99d91284e7deb6797e333cb52","international_phone_number":"+593 2-222-7847","name":"Iglesia La Viña Quito","opening_hours":{"open_now":false,"periods":[{"open":"1210","close":"1340"},{"open":"0900","close":"1430"},{"open":"0900","close":"1430"},{"open":"0900","close":"1430"},{"open":"0900","close":"1430"},{"open":"0900","close":"1430"},null],"weekday_text":["lunes: 9:00–14:30","martes: 9:00–14:30","miércoles: 9:00–14:30","jueves: 9:00–14:30","viernes: 9:00–14:30","sábado: Cerrado","domingo: 9:00–10:30, 10:35–12:05, 12:10–13:40"]},"place_id":"ChIJO0kuLmSa1ZERAIzHcJHwq5w","plus_code":{"compound_code":"RG65+4C Quito, Ecuador","global_code":"67F3RG65+4C"},"rating":4.9,"url":"https://maps.google.com/?cid=11289381398387330048","user_ratings_total":23,"utc_offset":-300,"vicinity":"Inglaterra, Quito","website":"https://www.vinaquito.com/","location":{"lat":-0.1896268,"lng":-78.4914501},"expected_time":52,"schedule":{"start":"12:30","end":"13:22"}},{"type":"lunch","duration":60,"schedule":{"start":"13:22","end":"14:22"}},{"type":"route","duration":14.583333333333334,"points":"n`d@xia~MjOtEvA\\r@T\\FN?`@G|@YbAc@|@Yf@Mr@@pB`AZTN`@DJZZRHnATh@wC~AeJ|AV","schedule":{"start":"14:22","end":"14:36"}},{"type":"poi","formatted_address":"Enrique Gangotena, Quito 170515, Ecuador","formatted_phone_number":"099 902 5333","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"dcaba38091daab49e35dae4483a0bf424bbf038a","international_phone_number":"+593 99 902 5333","name":"Museo Expofixion","opening_hours":{"open_now":false,"periods":[null,{"open":"0800","close":"1700"},{"open":"0800","close":"1700"},{"open":"0800","close":"1700"},{"open":"0800","close":"1700"},{"open":"0800","close":"1700"},{"open":"0800","close":"1700"}],"weekday_text":["lunes: 8:00–17:00","martes: 8:00–17:00","miércoles: 8:00–17:00","jueves: 8:00–17:00","viernes: 8:00–17:00","sábado: 8:00–17:00","domingo: Cerrado"]},"place_id":"ChIJHbwdI2ya1ZER6y1ipEHGp3Y","plus_code":{"compound_code":"RG35+2P Colon, Quito, Ecuador","global_code":"67F3RG35+2P"},"rating":4.6,"url":"https://maps.google.com/?cid=8550020402819247595","user_ratings_total":17,"utc_offset":-300,"vicinity":"Enrique Gangotena, Quito","location":{"lat":-0.1974599,"lng":-78.4906378},"expected_time":73,"schedule":{"start":"14:36","end":"15:49"}},{"type":"route","duration":6.25,"points":"vye@`r`~MqA`EyBnHUC[CSH[L_@b@Q`AfAP","schedule":{"start":"15:49","end":"15:55"}},{"type":"poi","formatted_address":"Reina Victoria N26-166, Quito 170517, Ecuador","formatted_phone_number":"(02) 252-0824","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"c44d2d192ea5e07f10f2f9eaa8442f9ee0ad782e","international_phone_number":"+593 2-252-0824","name":"Museo Etnohistórico de Artesanías del Ecuador Mindalae","opening_hours":{"open_now":false,"periods":[null,{"open":"0930","close":"1730"},{"open":"0930","close":"1730"},{"open":"0930","close":"1730"},{"open":"0930","close":"1730"},{"open":"0930","close":"1730"},{"open":"1000","close":"1730"}],"weekday_text":["lunes: 9:30–17:30","martes: 9:30–17:30","miércoles: 9:30–17:30","jueves: 9:30–17:30","viernes: 9:30–17:30","sábado: 10:00–17:30","domingo: Cerrado"]},"place_id":"ChIJd6N_BGma1ZERu9u8c6rR4rs","plus_code":{"compound_code":"RG26+CX Quito, Ecuador","global_code":"67F3RG26+CX"},"rating":4.5,"url":"https://maps.google.com/?cid=13538613959845534651","user_ratings_total":317,"utc_offset":-300,"vicinity":"Reina Victoria N26-166, Quito","website":"http://www.mindalae.com.ec/","location":{"lat":-0.1989856,"lng":-78.4875832},"expected_time":82,"schedule":{"start":"15:55","end":"17:17"}},{"type":"route","duration":47.53333333333333,"points":"lfe@hv}}MICKfAATFl@@z@GbA@pAFd@Q`@An@HRh@`@LTVx@HFP@j@Jh@Nl@LjAl@p@ZVBb@AV@LDb@^tBpBn@Pp@ZR?l@QT@d@FRHf@ZXTVVLFd@F^\\JH^@t@CXHTJXDpABLD@DCJa@N}@PGBAHDFF@ZC`@CX@j@HrATdARz@XTHLH?FELy@IiFM[BaBv@aB|@a@VMTCJi@Iy@QGRAb@@b@D`@Nn@Vf@PRd@Xb@P\\Hd@BHBJHP\\oDrAe@\\g@l@W^ITcAdBwAxBuAhBKTOdA{AfJHX~CdAc@|A","schedule":{"start":"17:17","end":"18:05"}},{"type":"poi","formatted_address":"De Los Conquistadores, Quito, Ecuador","formatted_phone_number":"(02) 323-8834","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_recreational-71.png","id":"ffe8510f371f2e5009d6c51a075f95eb5c1090a2","international_phone_number":"+593 2-323-8834","name":"Parque Guápulo","opening_hours":{"open_now":true,"periods":[{"open":"0600","close":"1830"},{"open":"0600","close":"1830"},{"open":"0600","close":"1830"},{"open":"0600","close":"1830"},{"open":"0600","close":"1830"},{"open":"0600","close":"1830"},{"open":"0600","close":"1830"}],"weekday_text":["lunes: 6:00–18:30","martes: 6:00–18:30","miércoles: 6:00–18:30","jueves: 6:00–18:30","viernes: 6:00–18:30","sábado: 6:00–18:30","domingo: 6:00–18:30"]},"place_id":"ChIJGUq4e56Q1ZERdH0rLAWfd80","plus_code":{"compound_code":"RG3G+7W Guápulo, Quito, Ecuador","global_code":"67F3RG3G+7W"},"rating":4.6,"url":"https://maps.google.com/?cid=14805477144568495476","user_ratings_total":958,"utc_offset":-300,"vicinity":"De Los Conquistadores, Quito","location":{"lat":-0.1968675,"lng":-78.4726878},"expected_time":65,"schedule":{"start":"18:05","end":"19:10"}}],[{"type":"home","location":{"lat":-0.20749,"lng":-78.496901}},{"type":"route","duration":4.633333333333334,"points":"pog@~lb~MeBaA_CgAa@S{AzCaD}As@]","schedule":{"start":"08:55","end":"09:00"}},{"type":"poi","formatted_address":"Av. 09 de Octubre 470 entre Roca y Robles, 9 de Octubre 470, Quito 170143, Ecuador","formatted_phone_number":"(02) 223-0502","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"c663ec4526e9e8d78629a427ee2c8688d8f0fba9","international_phone_number":"+593 2-223-0502","name":"Santa Teresita","opening_hours":{"open_now":true,"periods":[null,{"open":"0300","close":"1200"},{"open":"0300","close":"1200"},{"open":"0300","close":"1200"},{"open":"0300","close":"1200"},{"open":"0300","close":"1200"},null],"weekday_text":["lunes: 3:00–12:00","martes: 3:00–12:00","miércoles: 3:00–12:00","jueves: 3:00–12:00","viernes: 3:00–12:00","sábado: Cerrado","domingo: Cerrado"]},"place_id":"ChIJN4e7vxWa1ZERU3usXVWCRuc","plus_code":{"compound_code":"QGW3+4G Mariscal Sucre, Quito, Ecuador","global_code":"67F3QGW3+4G"},"rating":4.7,"url":"https://maps.google.com/?cid=16665150774286515027","user_ratings_total":153,"utc_offset":-300,"vicinity":"Av. 09 de Octubre 470 entre Roca y Robles, 9 de Octubre 470, Quito","website":"http://carmelitasdescalzosecuador.org/","location":{"lat":-0.2046501,"lng":-78.4962408},"expected_time":80,"schedule":{"start":"09:00","end":"10:20"}},{"type":"route","duration":12.4,"points":"v}f@`ib~MlD`Bf@XzA{CxA_DrBuAlBuAPIvAbBxAbB~AxBr@o@KMISE_@@SFSHKh@k@","schedule":{"start":"10:20","end":"10:32"}},{"type":"poi","formatted_address":"Avenida Patria (between Avenida 6 de Diciembre and Avenida 12 de Octubre), Quito 170136, Ecuador","formatted_phone_number":"(02) 381-4550","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"965e26979c44665f045801949cab7a0358c7917e","international_phone_number":"+593 2-381-4550","name":"Museo Nacional del Ecuador","opening_hours":{"open_now":false,"periods":[{"open":"0900","close":"1800"},null,{"open":"0900","close":"1800"},{"open":"0900","close":"1800"},{"open":"0900","close":"1800"},{"open":"0900","close":"1800"},{"open":"0900","close":"1800"}],"weekday_text":["lunes: Cerrado","martes: 9:00–18:00","miércoles: 9:00–18:00","jueves: 9:00–18:00","viernes: 9:00–18:00","sábado: 9:00–18:00","domingo: 9:00–18:00"]},"place_id":"ChIJmfLenxea1ZERU7Tnzp9q4wI","plus_code":{"compound_code":"QGR3+2R El Belén, Quito, Ecuador","global_code":"67F3QGR3+2R"},"rating":4.6,"url":"https://maps.google.com/?cid=208127242392810579","user_ratings_total":288,"utc_offset":-300,"vicinity":"Avenida Patria (between Avenida 6 de Diciembre and Avenida 12 de Octubre), Quito","website":"http://muna.culturaypatrimonio.gob.ec/","location":{"lat":-0.2099045,"lng":-78.4954389},"expected_time":74,"schedule":{"start":"10:32","end":"11:46"}},{"type":"route","duration":12.75,"points":"~|g@z`b~MWV[\\I^?TH\\PVs@n@i@u@_@i@UYRU`CsCn@q@vAcBP_@`@O`@BTCTKRMlAcAZ]DIuAiAs@k@_CiBm@}@GGq@\\CDRb@","schedule":{"start":"11:46","end":"11:59"}},{"type":"poi","formatted_address":"Avenida 12 de Octubre 1076 y Vicente Ramón Roca. Edificio del Centro Cultural 2do. piso., Quito 170143, Ecuador","formatted_phone_number":"(02) 299-1700","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"e6fd2b182e4b518d19a259959e092a6d669b05e6","international_phone_number":"+593 2-299-1700","name":"Museo Jacinto Jijón y Caamaño","opening_hours":{"open_now":false,"periods":[null,{"open":"0900","close":"1630"},{"open":"0900","close":"1630"},{"open":"0900","close":"1630"},{"open":"0900","close":"1630"},{"open":"0900","close":"1630"},null],"weekday_text":["lunes: 9:00–16:30","martes: 9:00–16:30","miércoles: 9:00–16:30","jueves: 9:00–16:30","viernes: 9:00–16:30","sábado: Cerrado","domingo: Cerrado"]},"place_id":"ChIJe4sJ-RCa1ZERJ02VZbxdYts","plus_code":{"compound_code":"QGR5+34 Quito, Ecuador","global_code":"67F3QGR5+34"},"rating":4.6,"url":"https://maps.google.com/?cid=15808300705763380519","user_ratings_total":24,"utc_offset":-300,"vicinity":"Avenida 12 de Octubre 1076 y Vicente Ramón Roca. Edificio del Centro Cultural 2do. piso., Quito","website":"https://www.puce.edu.ec/museojjc","location":{"lat":-0.209808,"lng":-78.492148},"expected_time":68,"schedule":{"start":"11:59","end":"13:07"}},{"type":"lunch","duration":60,"schedule":{"start":"13:07","end":"14:07"}},{"type":"route","duration":19.266666666666666,"points":"`ei@x|b~Mo@LKEa@eAEMIKYe@IEs@R{Bn@IYOi@oAeCIG][aBuAkBmAq@i@s@mA}@eBcA_B{A_CoAwBI]I[Sa@uA_C}AuCyC{FhAm@JLBAF@JLb@LVKh@|@BDq@\\CD?BR^","schedule":{"start":"14:07","end":"14:26"}},{"type":"poi","formatted_address":"Quito 170136, Ecuador","formatted_phone_number":"(02) 223-9515","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"75a8b87e46f0462db580f76ee3c8f783dd18b864","international_phone_number":"+593 2-223-9515","name":"National Museum of Medicine","opening_hours":{"open_now":false,"periods":[null,{"open":"1330","close":"1630"},{"open":"1330","close":"1630"},{"open":"1330","close":"1630"},{"open":"1330","close":"1630"},{"open":"1330","close":"1630"},null],"weekday_text":["lunes: 8:00–13:00, 13:30–16:30","martes: 8:00–13:00, 13:30–16:30","miércoles: 8:00–13:00, 13:30–16:30","jueves: 8:00–13:00, 13:30–16:30","viernes: 8:00–13:00, 13:30–16:30","sábado: Cerrado","domingo: Cerrado"]},"place_id":"ChIJTdwl7SGa1ZERppw9D-y_NS4","plus_code":{"compound_code":"QGM2+H7 Barrio El Dorado, Quito, Ecuador","global_code":"67F3QGM2+H7"},"rating":4.5,"url":"https://maps.google.com/?cid=3329778520099232934","user_ratings_total":42,"utc_offset":-300,"vicinity":"Quito","website":"http://instituciones.msp.gob.ec/museo/","location":{"lat":-0.2160625,"lng":-78.4992946},"expected_time":38,"schedule":{"start":"14:26","end":"15:04"}},{"type":"route","duration":18.166666666666668,"points":"njj@v{b~MQOyAUKAMF_@b@iAjA_@l@QTe@YmAu@e@Qy@g@oAw@S}@oB\\qB`@s@NQNUP}A`@QBWL]NaD|@oDjA[wA}@kCEMzBo@j@QL?NVV\\`@lAJJJ@h@O","schedule":{"start":"15:04","end":"15:22"}},{"type":"poi","formatted_address":"Quito 170136, Ecuador","formatted_phone_number":"099 711 2726","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_recreational-71.png","id":"862b8fa3052b56e1e688aced59ccc7d382c0276c","international_phone_number":"+593 99 711 2726","name":"Parque Itchimbía","opening_hours":{"open_now":true,"periods":[{"open":"0600","close":"1700"},{"open":"0600","close":"1700"},{"open":"0600","close":"1700"},{"open":"0600","close":"1700"},{"open":"0600","close":"1700"},{"open":"0600","close":"1700"},{"open":"0600","close":"1700"}],"weekday_text":["lunes: 6:00–17:00","martes: 6:00–17:00","miércoles: 6:00–17:00","jueves: 6:00–17:00","viernes: 6:00–17:00","sábado: 6:00–17:00","domingo: 6:00–17:00"]},"place_id":"ChIJrXGUIIuZ1ZER3pr6zhCXFlg","plus_code":{"compound_code":"QGH2+39 Itchimbía, Quito, Ecuador","global_code":"67F3QGH2+39"},"rating":4.5,"url":"https://maps.google.com/?cid=6347426823273093854","user_ratings_total":2857,"utc_offset":-300,"vicinity":"Quito","website":"http://www.epmmop.gob.ec/","location":{"lat":-0.2223173,"lng":-78.49909889999999},"expected_time":76,"schedule":{"start":"15:22","end":"16:38"}},{"type":"route","duration":27.966666666666665,"points":"njj@v{b~MQOyAUKAMF_@b@iAjA_@l@QTe@YmAu@e@Qy@g@oAw@S}@oB\\qB`@s@NQNUP}A`@QBWL]NaD|@oDjAk@Xy@d@gBtA}BnBu@l@RVZZ^Xn@`@|AbALJOVDBk@|Bs@|Bk@pBuB|FKDq@GU@MHK\\G`@{@IKDO?KASXAA","schedule":{"start":"16:38","end":"17:06"}},{"type":"poi","formatted_address":"Montevideo y Luis Dávila, Montevideo, Quito 170103, Ecuador","formatted_phone_number":"(02) 394-6990","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"3bb4c45af6d2251b2d37960bc04344aca240189b","international_phone_number":"+593 2-394-6990","name":"Centro de Arte Contemporáneo de Quito","opening_hours":{"open_now":false,"periods":[{"open":"0900","close":"1730"},null,{"open":"1030","close":"1730"},{"open":"1030","close":"1730"},{"open":"1030","close":"1730"},{"open":"1030","close":"1730"},{"open":"0900","close":"1730"}],"weekday_text":["lunes: Cerrado","martes: 10:30–17:30","miércoles: 10:30–17:30","jueves: 10:30–17:30","viernes: 10:30–17:30","sábado: 9:00–17:30","domingo: 9:00–17:30"]},"place_id":"ChIJT4WXJSWa1ZERGw6R23KGMzU","plus_code":{"compound_code":"QFQV+C7 San Juan, Quito, Ecuador","global_code":"67F3QFQV+C7"},"rating":4.5,"url":"https://maps.google.com/?cid=3833555535690534427","user_ratings_total":1159,"utc_offset":-300,"vicinity":"Montevideo y Luis Dávila, Montevideo, Quito","website":"http://centrodeartecontemporaneo.gob.ec/","location":{"lat":-0.2114021,"lng":-78.50685639999999},"expected_time":40,"schedule":{"start":"17:06","end":"17:46"}},{"type":"route","duration":14.15,"points":"bpi@~~c~MY~@Ul@NJBNHd@Fl@H`@YCAKOs@S_@SYMMcAZ{Ad@cA^mCbAYX_BlBgBgAoCwAc@EsB_@KNC@WAWEU?OFMVETCTQAi@GEBK@UASXAA","schedule":{"start":"17:46","end":"18:00"}},{"type":"poi","formatted_address":"Quito 170136, Ecuador","formatted_phone_number":"(02) 228-1786","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"f1a6715f8e3203580a81a658963f84f2db5b97ce","international_phone_number":"+593 2-228-1786","name":"Iglesia San Blas","opening_hours":{"open_now":false,"periods":[{"open":"0700","close":"1830"},null,null,null,{"open":"1800","close":"1930"},null,{"open":"0700","close":"1830"}],"weekday_text":["lunes: Cerrado","martes: Cerrado","miércoles: Cerrado","jueves: 18:00–19:30","viernes: Cerrado","sábado: 7:00–18:30","domingo: 7:00–18:30"]},"place_id":"ChIJg8x5PCea1ZERr-rGNHll8HI","plus_code":{"compound_code":"QFJV+PX La Tola, Quito, Ecuador","global_code":"67F3QFJV+PX"},"rating":4.5,"url":"https://maps.google.com/?cid=8282231285985241775","user_ratings_total":18,"utc_offset":-300,"vicinity":"Quito","location":{"lat":-0.2181375,"lng":-78.5051127},"expected_time":54,"schedule":{"start":"18:00","end":"18:54"}},{"type":"route","duration":62.46666666666667,"points":"bpi@~~c~MY~@Ul@|@b@hB`AtAfAjCfB`CbB~AxAl@Xt@Ph@JfATv@DbA?NEdAo@pAc@p@M\\Of@c@^k@z@}@h@_@RKv@QlAKhD@dFC|AK`@Ab@FLB^Jv@FP?zBk@zAm@j@[f@o@Pa@v@qEHQl@w@t@y@z@e@HEjAAvBE`BG\\CZIRIFZn@_@Ry@Co@c@iAoDaIsDoHo@_AyB_CmBuBw@}@{BoE_AuAkBgCyDgFWc@Yu@O}@Eq@B{@ZqE?iAK_AUy@mAqC_@gAUwACs@@q@RoAPg@x@uAdDgFbAcB|@wAj@o@p@k@zA_A","schedule":{"start":"18:54","end":"19:57"}},{"type":"poi","formatted_address":"Autopista Gral. Rumiñahui, Quito 170145, Ecuador","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_recreational-71.png","id":"d93d9667350b9a750feeb91c526d98acaab650c9","name":"Parque Cuscungo","opening_hours":{"open_now":true,"periods":[{"open":"0600","close":"2000"},{"open":"0600","close":"2000"},{"open":"0600","close":"2000"},{"open":"0600","close":"2000"},{"open":"0600","close":"2000"},{"open":"0600","close":"2000"},{"open":"0600","close":"2000"}],"weekday_text":["lunes: 6:00–20:00","martes: 6:00–20:00","miércoles: 6:00–20:00","jueves: 6:00–20:00","viernes: 6:00–20:00","sábado: 6:00–20:00","domingo: 6:00–20:00"]},"place_id":"ChIJGzMVUOaZ1ZERVm6Rtu2bV0s","plus_code":{"compound_code":"QGC7+3M Luluncoto, Quito, Ecuador","global_code":"67F3QGC7+3M"},"rating":4.2,"url":"https://maps.google.com/?cid=5428979321090960982","user_ratings_total":1225,"utc_offset":-300,"vicinity":"Autopista General Rumiñahui, Quito","location":{"lat":-0.229867,"lng":-78.48575509999999},"expected_time":43,"schedule":{"start":"19:57","end":"20:40"}}]];


  return from(tours).pipe(
      map(tour => {
          let last_index = tour.findIndex(
              event =>
                  Number(get(event, "schedule.start", "").replace(":", "")) >=
                  Number(userInfo.travelSchedule.end)
          );

          if (last_index === -1)
              return _finishTour(tour, userInfo.travelSchedule.end);

          last_index =
              tour[last_index].type === "poi" ? last_index + 1 : last_index;

          return _finishTour(
              tour.slice(0, last_index),
              userInfo.travelSchedule.end
          );
      }),
    concatMap(tour =>
      forkJoin(of(tour), getRestaurants(tour))
    ),
    reduce(
      (acc, [tour, restaurants]) => [
        ...acc,
        {
          tour,
          restaurants
        }
      ],
      []
    )

    //  -------------------El Normalf-------------
    //   switchMap(pois => getClusters(pois, userInfo.totalDays)),
    // concatMap(clusters => from(clusters)),
    // mergeMap((cluster, index) => {
    //   const travel_date = start_date.clone().add(index, "day");
    //
    //   return forkJoin(getDetails(cluster, travel_date), of(travel_date));
    // }),
    // concatMap(([pois, travel_date]) =>
    //   forkJoin(
    //     getTour(
    //       [{ location: userInfo.location }, ...pois],
    //       userInfo,
    //       travel_date
    //     ),
    //     of(travel_date)
    //   )
    // ),
    // concatMap(([tour, travel_date]) =>
    //   forkJoin(of(tour), getRestaurants(tour), of(travel_date))
    // ),
    // reduce(
    //   (acc, [tour, restaurants, travel_date]) => [
    //     ...acc,
    //     {
    //       tour,
    //       restaurants,
    //       travelDate: travel_date.format("YYYY-MM-DD")
    //     }
    //   ],
    //   []
    // )


    //  -----------------timeMatrix and Clusters---------------------------
    // concatMap(([cluster, travel_date]) => {
    //     const all = [{ location: userInfo.location }, ...cluster];
    //
    //     return forkJoin(of(all), api.getTimeMatrix(all), of(travel_date));
    // }),
    //     reduce(
    //         (acc, [cluster, timeMatrix, travel_date]) => [
    //             ...acc,
    //             {
    //                 cluster,
    //                 timeMatrix,
    //                 travelDate: travel_date.format("YYYY-MM-DD")
    //             }
    //         ],
    //         []
    //     )
  );
}

function getPois(location, categories) {
  return from(categories).pipe(
    mergeMap(category => api.getPois(location, 3000, category)),
    reduce((acc, curr) => [...acc, ...curr], [])
  );
}

function getClusters(pois, totalDays) {
  return of(
    pois.map(poi => ({
      ...poi,
      x: poi.location.lat,
      y: poi.location.lng
    }))
  ).pipe(
    map(mapped_pois => {
      kmeans.init({
        k: totalDays,
        runs: ~~(mapped_pois.length / totalDays),
        equalSize: true,
        normalize: false
      });
      kmeans.calc(mapped_pois);

      return mapped_pois;
    }),
    concatMap(pois => from(pois)),
    reduce((clusters, poi) => {
      const index = poi.k;
      delete poi.k;
      delete poi.x;
      delete poi.y;

      clusters[index].push(poi);

      return clusters;
    }, Array.from(Array(totalDays), _ => []))
  );
}

function getDetails(cluster, travelDate) {
  return from(cluster).pipe(
    concatMap(poi => api.getDetails(poi.place_id)),
    filter(
      poi => !isNil(get(poi, `opening_hours.periods[${travelDate.day()}]`))
    ), // TODO: uncomment this in case of using another API
    scan((new_cluster, x) => [...new_cluster, x], []),
    takeWhile(new_cluster => new_cluster.length <= 8),
    reduce((_, new_cluster) => new_cluster)
  );
}

function getTour(pois, userInfo, travelDate) {
  return api.getTimeMatrix(pois).pipe(
    map(matrix => {
      const ga = new GeneticAlgorithm({
        pois,
        timeMatrix: matrix,
        travelDate: travelDate.toDate(),
        travelSchedule: userInfo.travelSchedule,
        lunchTime: userInfo.lunchTime,
        totalGenerations: 100 * pois.length,
        populationSize: pois.length ** 2, // TODO: averiguar bien
        crossOverProbability: 1 / 3,
        mutationProbability: 0.05
      });

      const tour = ga.evolve();
      let last_index = tour.findIndex(
        event =>
          Number(get(event, "schedule.start", "").replace(":", "")) >=
          Number(userInfo.travelSchedule.end)
      );

      if (last_index === -1)
        return _finishTour(tour, userInfo.travelSchedule.end);

      last_index =
        tour[last_index].type === "poi" ? last_index + 1 : last_index;

      return _finishTour(
        tour.slice(0, last_index),
        userInfo.travelSchedule.end
      );
    })
  );
}


function getRestaurants(tour) {
  const lunch_index = tour.findIndex(poi => poi.type === "lunch");

  if (lunch_index === -1) return of([]);

  const location =
    tour[lunch_index - 1].type === "poi"
      ? tour[lunch_index - 1].location
      : tour[lunch_index + 1].location;

  return api.getPois(location, 500, "restaurant").pipe(
    map(results =>
      results
        .map(restaurant => ({
          ...restaurant,
          schedule: tour[lunch_index].schedule
        }))
        .slice(0, 5)
    )
  );
}

module.exports = {
  main,
  getPois,
  getClusters,
  getDetails,
  getTour
};

function _finishTour(new_tour, endTour) {
  const last = new_tour.length - 1;
  const end_poi = Number(
    get(new_tour, `[${last}].schedule.end`).replace(":", "")
  );
  const end_tour = Number(endTour);

  if (end_poi > end_tour || Math.abs(end_poi - end_tour) < 20)
    new_tour[last].schedule.end = `${endTour.substr(0, 2)}:${endTour.substr(
      2,
      4
    )}`;

  return new_tour;
}

// return getPois(userInfo.location, userInfo.categories).pipe(
//     switchMap(pois => getClusters(pois, userInfo.totalDays)),
//     concatMap(clusters => from(clusters)),
//     mergeMap((cluster, index) => {
//         const travel_date = start_date.clone().add(index, "day");
//
//         return getDetails(cluster, travel_date);
//     }),
//     map(pois => [{ location: userInfo.location }, ...pois]),
//
//     concatMap(cluster => forkJoin(of(cluster), api.getTimeMatrix(cluster))),
//     reduce(
//         (acc, [cluster, timeMatrix]) => [
//             ...acc,
//             {
//                 cluster,
//                 timeMatrix
//             }
//         ],
//         []
//     )
// );
