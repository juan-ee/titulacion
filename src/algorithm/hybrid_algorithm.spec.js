const { it } = require("mocha");
const { expect } = require("chai");
const { createSandbox } = require("sinon");
const rp = require("request-promise");
const api = require("../api/google_api");
const mock = require("./mock_objects");
const { switchMap } = require("rxjs/operators");
const { of } = require("rxjs");
const moment = require("moment");

const algorithm = require("./hybrid_algorithm");

describe("Hybrid Algorithm Tests", () => {
  let sandbox;

  beforeEach(() => {
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
