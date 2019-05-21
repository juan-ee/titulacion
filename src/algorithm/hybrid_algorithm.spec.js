const { it } = require("mocha");
const { expect } = require("chai");
const { createSandbox } = require("sinon");
const rp = require("request-promise");
const mock = require("./mock_objects");
const { switchMap } = require("rxjs/operators");
const { of } = require("rxjs");
const moment = require("moment");
const algorithm = require("./hybrid_algorithm");

describe("Hybrid Algorithm Tests", () => {
  let sandbox;
  let tour;

  beforeEach(() => {
    tour = [{"type":"home","location":{"lat":-0.205639,"lng":-78.496816}},{"type":"route","duration":1.65,"points":"|cg@plb~MqCqAl@_A","schedule":{"start":"08:58","end":"09:00"}},{"type":"poi","formatted_address":"Quito 170143, Ecuador","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"f0f3b5f33841da4902f83240bce08a7e3b765806","name":"Santa Teresita Church","place_id":"ChIJO4j5_UiY1ZERLPlvJrEw9Mo","plus_code":{"compound_code":"QGV3+XH Mariscal Sucre, Quito, Ecuador","global_code":"67F3QGV3+XH"},"rating":4.6,"url":"https://maps.google.com/?cid=14624367427391060268","user_ratings_total":16,"utc_offset":-300,"vicinity":"Quito","location":{"lat":-0.2050172,"lng":-78.4961175},"expected_time":89,"schedule":{"start":"09:00","end":"10:29"}},{"type":"route","duration":16.3,"points":"vmg@lq`~MY^eAvAT`@vBvDUNbChEzAnCtAbCN\\nAvBaKvGiBlAoEvC}A~Cq@|A","schedule":{"start":"10:29","end":"10:45"}},{"type":"poi","formatted_address":"Madrid, Quito 170143, Ecuador","formatted_phone_number":"(02) 252-1930","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"4128c948b1900b8c7595731957b8ec5bcbf698e0","international_phone_number":"+593 2-252-1930","name":"Congregación de Hermanas Dominicas (Catholic Chapel/Church)","place_id":"ChIJ_9UewhGa1ZERxsZNCbxDtyo","plus_code":{"compound_code":"QGV6+2X La Floresta, Quito, Ecuador","global_code":"67F3QGV6+2X"},"rating":5,"url":"https://maps.google.com/?cid=3078003345220028102","user_ratings_total":5,"utc_offset":-300,"vicinity":"Madrid, Quito","location":{"lat":-0.2073772,"lng":-78.4876049},"expected_time":46,"schedule":{"start":"10:45","end":"11:31"}},{"type":"route","duration":10.55,"points":"vmg@lq`~MY^eAvAT`@rDtGfAjB`CjEjCzEF@FFFJfCzEb@^_@NGJ","schedule":{"start":"11:31","end":"11:41"}},{"type":"poi","formatted_address":"Av. 6 de Diciembre 345, Quito 170143, Ecuador","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_recreational-71.png","id":"9c03671241433ae1a3701c44bdce39ee53a1c2c4","name":"Las Focas","opening_hours":{"open_now":true,"periods":[{"open":{"day":0,"time":"0000"}}],"weekday_text":["Monday: Open 24 hours","Tuesday: Open 24 hours","Wednesday: Open 24 hours","Thursday: Open 24 hours","Friday: Open 24 hours","Saturday: Open 24 hours","Sunday: Open 24 hours"]},"place_id":"ChIJ0zEhZxea1ZERa7EsT_C0d4o","plus_code":{"compound_code":"QGQ4+RF El Belen, Quito, Ecuador","global_code":"67F3QGQ4+RF"},"rating":4.6,"url":"https://maps.google.com/?cid=9977642443676103019","user_ratings_total":5,"utc_offset":-300,"vicinity":"Avenida 6 de Diciembre 345, Quito","location":{"lat":-0.2104116,"lng":-78.4937843},"expected_time":81,"schedule":{"start":"11:41","end":"13:02"}},{"type":"lunch","duration":60,"schedule":{"start":"13:02","end":"14:02"}},{"type":"route","duration":6.583333333333333,"points":"r`h@~xa~MU`@i@l@cAhAaAjAcBlBh@t@t@bAr@o@KMISE_@@SFSf@m@JI","schedule":{"start":"14:02","end":"14:09"}},{"type":"poi","formatted_address":"Avenida Patria (between Avenida 6 de Diciembre and Avenida 12 de Octubre), Quito 170136, Ecuador","formatted_phone_number":"(02) 381-4550","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"965e26979c44665f045801949cab7a0358c7917e","international_phone_number":"+593 2-381-4550","name":"National Museum of Ecuador","opening_hours":{"open_now":false,"periods":[{"open":"0900","close":"1800"},null,{"open":"0900","close":"1800"},{"open":"0900","close":"1800"},{"open":"0900","close":"1800"},{"open":"0900","close":"1800"},{"open":"0900","close":"1800"}],"weekday_text":["Monday: Closed","Tuesday: 9:00 AM – 6:00 PM","Wednesday: 9:00 AM – 6:00 PM","Thursday: 9:00 AM – 6:00 PM","Friday: 9:00 AM – 6:00 PM","Saturday: 9:00 AM – 6:00 PM","Sunday: 9:00 AM – 6:00 PM"]},"place_id":"ChIJmfLenxea1ZERU7Tnzp9q4wI","plus_code":{"compound_code":"QGR3+2R El Belen, Quito, Ecuador","global_code":"67F3QGR3+2R"},"rating":4.6,"url":"https://maps.google.com/?cid=208127242392810579","user_ratings_total":264,"utc_offset":-300,"vicinity":"Avenida Patria (between Avenida 6 de Diciembre and Avenida 12 de Octubre), Quito","website":"http://muna.culturaypatrimonio.gob.ec/","location":{"lat":-0.2099045,"lng":-78.4954389},"expected_time":62,"schedule":{"start":"14:09","end":"15:11"}},{"type":"route","duration":13,"points":"`uh@fic~Mm@h@u@l@m@y@q@_AaAgAuAsAk@}@MQE[[u@Oc@K]C[Ck@EOGCIECAFg@Lq@J]LOMK}@y@_BcBaBgB_AmAe@k@[_@r@o@QWI]Bg@DMZ]VW","schedule":{"start":"15:11","end":"15:24"}},{"type":"poi","formatted_address":"Luis Sodiro, Quito 170136, Ecuador","formatted_phone_number":"(02) 222-4100","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/worship_general-71.png","id":"5943570a0dcd6c524991e31cdf28d512355bdaba","international_phone_number":"+593 2-222-4100","name":"Church of El Belen","place_id":"ChIJFVzABCOa1ZER1tn0a-9_EHg","plus_code":{"compound_code":"QFPX+PF El Belen, Quito, Ecuador","global_code":"67F3QFPX+PF"},"rating":4.7,"url":"https://maps.google.com/?cid=8651555550463842774","user_ratings_total":46,"utc_offset":-300,"vicinity":"Luis Sodiro, Quito","location":{"lat":-0.2132473,"lng":-78.501254},"expected_time":82,"schedule":{"start":"15:24","end":"16:46"}},{"type":"route","duration":12.55,"points":"`fi@lsb~M}@oCBEb@Ok@eB{F~AeEhAn@lBFTnAdCNh@Nf@|@jCZvAk@Xy@d@uC|Ba@\\","schedule":{"start":"16:46","end":"16:58"}},{"type":"poi","formatted_address":"Eugenio Espejo, Centro de Convenciones, Av. Gran Colombia, Quito 170136, Ecuador","formatted_phone_number":"099 901 0624","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/museum-71.png","id":"e39e1cc4b2ca00892c5bd24ec83fb8abf294da1e","international_phone_number":"+593 99 901 0624","name":"JACCHIGUA","opening_hours":{"open_now":false,"periods":[null,null,null,{"open":"1800","close":"2130"},null,{"open":"1800","close":"2130"},null],"weekday_text":["Monday: Closed","Tuesday: Closed","Wednesday: 6:00 – 9:30 PM","Thursday: Closed","Friday: 6:00 – 9:30 PM","Saturday: Closed","Sunday: Closed"]},"place_id":"ChIJezCMhhea1ZERqHT4m-nM8bs","plus_code":{"compound_code":"QGM2+PP Quito, Ecuador","global_code":"67F3QGM2+PP"},"rating":4.9,"url":"https://maps.google.com/?cid=13542830858195989672","user_ratings_total":10,"utc_offset":-300,"vicinity":"Centro de Convenciones, Eugenio Espejo, Avenida Gran Colombia, Quito","website":"http://www.jacchigua.org/","location":{"lat":-0.2156997,"lng":-78.4981992},"expected_time":59,"schedule":{"start":"16:58","end":"17:57"}},{"type":"route","duration":17.9,"points":"`fi@lsb~M}@oCBEb@Ok@eBbFuAdCo@RAVBRHTLL\\Tn@t@tBXbAXdBt@|ELNh@Xz@h@ZRZJjAp@p@b@h@w@p@u@z@cATIxATLBFHBB","schedule":{"start":"17:57","end":"18:15"}},{"type":"poi","formatted_address":"Quito 170136, Ecuador","formatted_phone_number":"099 711 2726","icon":"https://maps.gstatic.com/mapfiles/place_api/icons/generic_recreational-71.png","id":"862b8fa3052b56e1e688aced59ccc7d382c0276c","international_phone_number":"+593 99 711 2726","name":"Itchimbia Park","opening_hours":{"open_now":false,"periods":[{"open":"0600","close":"1700"},{"open":"0600","close":"1700"},{"open":"0600","close":"1700"},{"open":"0600","close":"1700"},{"open":"0600","close":"1700"},{"open":"0600","close":"1700"},{"open":"0600","close":"1700"}],"weekday_text":["Monday: 6:00 AM – 5:00 PM","Tuesday: 6:00 AM – 5:00 PM","Wednesday: 6:00 AM – 5:00 PM","Thursday: 6:00 AM – 5:00 PM","Friday: 6:00 AM – 5:00 PM","Saturday: 6:00 AM – 5:00 PM","Sunday: 6:00 AM – 5:00 PM"]},"place_id":"ChIJrXGUIIuZ1ZER3pr6zhCXFlg","plus_code":{"compound_code":"QGH2+39 Itchimbia, Quito, Ecuador","global_code":"67F3QGH2+39"},"rating":4.5,"url":"https://maps.google.com/?cid=6347426823273093854","user_ratings_total":2710,"utc_offset":-300,"vicinity":"Quito","website":"http://www.epmmop.gob.ec/","location":{"lat":-0.2223173,"lng":-78.49909889999999},"expected_time":56,"schedule":{"start":"18:15","end":"19:11"}}];
    sandbox = createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should get pois", done => {
    const mock_pois = mock.mockPoisGoogle();
    sandbox.stub(rp, "get").resolves(mock_pois);

    const location = { lat: 52.189458, lng: 21.006501 };
    const categories = ["museum", "park", "church"];

    algorithm.getPois(location, categories).subscribe({
      next: pois => {
        expect(pois.length).to.be.eq(
          mock_pois.results.length * categories.length
        );
        done();
      }
    });
  });

  it("should get clusters", done => {
    const total_clusters = 3;

    of(mock.mockPois())
      .pipe(switchMap(pois => algorithm.getClusters(pois, total_clusters)))
      .subscribe({
        next: clusters => {
          expect(clusters.length).to.be.eq(total_clusters);
          expect(clusters[0][0]).to.not.have.property("k");
          expect(clusters[0][0]).to.not.have.property("x");
          expect(clusters[0][0]).to.not.have.property("y");
          done();
        }
      });
  });

  it("should get details", done => {
    const cluster = mock.mockCluster();
    const get_stub = sandbox.stub(rp, "get");
    for (let i in cluster) {
      get_stub.onCall(i).resolves(mock.mockDetailsGoogle());
    }

    of(cluster)
      .pipe(switchMap(cluster => algorithm.getDetails(cluster, moment())))
      .subscribe({
        next: detailed_pois => {
          expect(detailed_pois.length).to.be.eq(7);
          done();
        }
      });
  });


  it('should finish tour - after the end', () => {

    const last_result = algorithm._finishTour(tour,"0600");
    const last_poi = last_result.length - 1;

    console.log();
    expect(last_result[last_poi].type).to.be.eq("poi");
    expect(last_result.length).to.be.eq(tour.length - 2);
    expect(last_result[last_poi].schedule.start).to.be.eq(tour[tour.length-3].schedule.start);
    expect(last_result[last_poi].schedule.end).to.be.eq(tour[tour.length-2].schedule.end);
  });

  it('should finish tour - before the end ', () => {
    const last_result = algorithm._finishTour(tour,"1830");
    const last_poi = last_result.length - 1;

    expect(last_result[last_poi].type).to.be.eq("poi");
    expect(last_result[last_poi].schedule.start).to.be.eq(tour[tour.length-1].schedule.start);
    expect(last_result[last_poi].schedule.end).to.be.eq("18:30");
  });



  it("should get tour", done => {
    const user_info = {
      totalDays: 3,
      startDate: "2019-06-14",
      location: {
        lat: 52.189458,
        lng: 21.006501
      },
      travelSchedule: {
        start: "0900",
        end: "1730"
      },
      lunchTime: {
        start: "1300",
        end: "1400"
      },
      categories: ["museum"]
    };

    sandbox.stub(rp, "get").resolves(mock.mockDirectionsGoogle());

    const pois = mock.mockCluster();

    of(pois)
      .pipe(
        switchMap(cluster => algorithm.getTour(cluster, user_info, moment()))
      )
      .subscribe({
        next: tour => {
          expect(tour.length).to.be.eq(pois.length * 2);
          done();
        }
      });
  }).timeout(5000);
});
