import Timesheet from '@/components/timesheet'

const Case = {}
const Search =  {}
const PayPeriod = {}
debugger;
const routes = [
    {path: '/timesheet', component: timesheet},
    {path: '/case', component: Case},
    {path: '/search', component: Search},
    {path: '/payperiod', component: PayPeriod}
]

const router = new VueRouter({
    mode: 'history',
    routes: routes,
})

