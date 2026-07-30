export const AUTH_LOGIN = 'auth.login' as const;
export const AUTH_REGISTER = 'auth.register' as const;
export const AUTH_REFRESH = 'auth.refresh' as const;
export const AUTH_VALIDATE_TOKEN = 'auth.validateToken' as const;
export const AUTH_WS_TOKEN = 'auth.wsToken' as const;

export const USER_CREATE_PROFILE = 'user.createProfile' as const;
export const USER_GET_PROFILE = 'user.getProfile' as const;
export const USER_MANAGE_INTERNAL = 'user.manageInternal' as const;
export const USER_MANAGE_CUSTOMERS = 'user.manageCustomers' as const;

export const BUS_CREATE = 'bus.create' as const;
export const BUS_LIST = 'bus.list' as const;
export const SEAT_SAVE_LAYOUT = 'seat.saveLayout' as const;
export const SEAT_GET_LAYOUT_BY_BUS = 'seat.getLayoutByBus' as const;
export const TRIP_CREATE = 'trip.create' as const;
export const TRIP_SEARCH = 'trip.search' as const;
export const TRIP_GET = 'trip.get' as const;

export const ROUTE_CREATE_LOCATION = 'route.createLocation' as const;
export const ROUTE_CREATE_ROUTE = 'route.createRoute' as const;
export const ROUTE_GET_OSM_PATH = 'route.getOsmPath' as const;
export const ROUTE_LIST_LOCATIONS = 'route.listLocations' as const;
export const ROUTE_LIST_ROUTES = 'route.listRoutes' as const;

export const BOOKING_LOCK_SEAT = 'booking.lockSeat' as const;
export const BOOKING_RELEASE_SEATS = 'booking.releaseSeats' as const;
export const BOOKING_CONFIRM = 'booking.confirm' as const;
export const BOOKING_MY_BOOKINGS = 'booking.myBookings' as const;
export const BOOKING_GET_SEAT_MAP = 'booking.getSeatMap' as const;

export const PAYMENT_PROCESS_ONLINE = 'payment.processOnline' as const;
export const PAYMENT_RECORD_OFFLINE = 'payment.recordOffline' as const;

export const CANCELLATION_REQUEST = 'cancellation.request' as const;
export const REFUND_CALCULATE = 'refund.calculate' as const;
