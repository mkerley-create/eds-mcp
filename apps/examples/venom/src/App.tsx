import '@edmunds/eds-bootstrap-adapter/bootstrap-bridge.css';
import {VehicleCard} from '@edmunds/eds-patterns';

export function VenomRoute() {
  return (
    <div className="venom-app container py-4" data-venom-app data-eds-theme="edmunds">
      <div className="row">
        <div className="col-sm-6 col-lg-4">
          <VehicleCard year={2024} make="Toyota" model="RAV4" price={31750} mileage={9200} />
        </div>
      </div>
    </div>
  );
}
