import { ACTIONS, RESOURCES } from "../../constants/permissions";

export const routePermissions = {
  "/": { resource: RESOURCES.DASHBOARD, action: ACTIONS.READ },
  "/add-products": { resource: RESOURCES.PRODUCTS, action: ACTIONS.CREATE },
  "/list-products": { resource: RESOURCES.PRODUCTS, action: ACTIONS.READ },
  "/list-products/:slug": {
    resource: RESOURCES.PRODUCTS,
    action: ACTIONS.READ,
  },
  "/list-products/:slug/edit": {
    resource: RESOURCES.PRODUCTS,
    action: ACTIONS.UPDATE,
  },
  "/orders": { resource: RESOURCES.ORDERS, action: ACTIONS.READ },
  "/orders/:orderId": { resource: RESOURCES.ORDERS, action: ACTIONS.READ },
  "/orders/:orderId/track": {
    resource: RESOURCES.TRACKING,
    action: ACTIONS.TRACK_SHIPMENT,
  },
  "/payments": { resource: RESOURCES.PAYMENTS, action: ACTIONS.READ },
  "/users": { resource: RESOURCES.USERS, action: ACTIONS.READ },
  "/admins": { resource: RESOURCES.ADMINS, action: ACTIONS.READ },
  "/admins/add": { resource: RESOURCES.ADMINS, action: ACTIONS.CREATE },
  "/admins/:adminId/edit": {
    resource: RESOURCES.ADMINS,
    action: ACTIONS.UPDATE,
  },
  "/roles": { resource: RESOURCES.ROLES, action: ACTIONS.READ },
  "/roles/add": { resource: RESOURCES.ROLES, action: ACTIONS.CREATE },
  "/roles/:roleId/edit": { resource: RESOURCES.ROLES, action: ACTIONS.UPDATE },
  "/blogs": { resource: RESOURCES.BLOG_POSTS, action: ACTIONS.READ },
  "/blogs/add": { resource: RESOURCES.BLOG_POSTS, action: ACTIONS.CREATE },
  "/blogs/:slug/edit": {
    resource: RESOURCES.BLOG_POSTS,
    action: ACTIONS.UPDATE,
  },
  "/countries": { resource: RESOURCES.COUNTRIES, action: ACTIONS.READ },
  "/countries/add": { resource: RESOURCES.COUNTRIES, action: ACTIONS.CREATE },
  "/countries/:countryId/edit": {
    resource: RESOURCES.COUNTRIES,
    action: ACTIONS.UPDATE,
  },
  "/states": { resource: RESOURCES.STATES, action: ACTIONS.READ },
  "/states/add": { resource: RESOURCES.STATES, action: ACTIONS.CREATE },
  "/states/:stateId/edit": { resource: RESOURCES.STATES, action: ACTIONS.UPDATE },
  "/cities": { resource: RESOURCES.CITIES, action: ACTIONS.READ },
  "/cities/add": { resource: RESOURCES.CITIES, action: ACTIONS.CREATE },
  "/cities/:cityId/edit": { resource: RESOURCES.CITIES, action: ACTIONS.UPDATE },
  "/carts": { resource: RESOURCES.CARTS, action: ACTIONS.READ },
  "/suppliers": { resource: RESOURCES.SUPPLIERS, action: ACTIONS.READ },
  "/facility/requests": {
    resource: RESOURCES.CREDIT_FACILITY,
    action: ACTIONS.READ,
  },
  "/facility/requests/:requestId": {
    resource: RESOURCES.CREDIT_FACILITY,
    action: ACTIONS.READ,
  },
  "/facility/requests/:requestId/edit": {
    resource: RESOURCES.CREDIT_FACILITY,
    action: ACTIONS.UPDATE,
  },
  "/supply-chain/drivers": {
    resource: RESOURCES.DRIVERS,
    action: ACTIONS.READ,
  },
  "/supply-chain/shipments": {
    resource: RESOURCES.SHIPMENTS,
    action: ACTIONS.READ,
  },
  "/careers": { resource: RESOURCES.CAREERS, action: ACTIONS.READ },
  "/careers/jobs": { resource: RESOURCES.CAREERS, action: ACTIONS.READ },
  "/careers/jobs/:jobId": { resource: RESOURCES.CAREERS, action: ACTIONS.READ },
  "/careers/jobs/:jobId/edit": {
    resource: RESOURCES.CAREERS,
    action: ACTIONS.UPDATE,
  },
  "/careers/applications": { resource: RESOURCES.CAREERS, action: ACTIONS.READ },
  "/careers/create": { resource: RESOURCES.CAREERS, action: ACTIONS.CREATE },
  "/ayo-ai": { resource: RESOURCES.ANALYTICS, action: ACTIONS.READ },
};
