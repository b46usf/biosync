import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

export function ActivityTrendChart({ data }) {
  return <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 12, right: 7, left: -25, bottom: 0 }}><defs><linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#18cbb6" stopOpacity={0.22}/><stop offset="95%" stopColor="#18cbb6" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1f5" strokeDasharray="3 5"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#99a5b4', fontSize: 11 }} dy={11}/><Area type="monotone" dataKey="steps" stroke="#16bfae" strokeWidth={2.5} fill="url(#stepsGradient)" dot={false} activeDot={{ r: 5, fill: '#16bfae', stroke: '#fff', strokeWidth: 3 }}/><Tooltip contentStyle={{ border: 'none', borderRadius: 12, boxShadow: '0 8px 30px #132b4317', fontSize: 12 }} formatter={(v) => [`${v.toLocaleString()} steps`, 'Steps']}/></AreaChart></ResponsiveContainer>
}

export function HealthSparkline({ data }) {
  return <ResponsiveContainer width="100%" height="100%"><AreaChart data={data}><Area dataKey="heart" type="monotone" stroke="#21bea9" fill="#21bea9" fillOpacity={.1} strokeWidth={2} dot={false}/></AreaChart></ResponsiveContainer>
}

export function HealthTrendChart({ data }) {
  return <ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{top:12,right:8,left:-20,bottom:0}}><defs><linearGradient id="healthGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#16bfae" stopOpacity={.19}/><stop offset="100%" stopColor="#16bfae" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf1f5" strokeDasharray="3 5"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill:'#99a5b4',fontSize:11}} dy={10}/><Area dataKey="heart" type="monotone" stroke="#16bfae" strokeWidth={2.5} fill="url(#healthGradient)" dot={false}/><Tooltip/></AreaChart></ResponsiveContainer>
}
