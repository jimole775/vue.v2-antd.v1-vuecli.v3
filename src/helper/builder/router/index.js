export default [
  {
    path: '/helper/builder',
    name: 'builder',
    redirect: '/helper/builder/factory',
    component: () => import('@/helper/builder/index.vue'),
    children: [
      {
        path: '/helper/builder/factory',
        name: 'builderFactory',
        component: () => import('@/helper/builder/pages/factory/index.vue')
      }
    ]
  }
]