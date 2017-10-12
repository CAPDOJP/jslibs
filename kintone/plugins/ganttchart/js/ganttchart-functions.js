(function($){
jQuery.extend({
	/* calculate date values */
	ganttchartdatecalc:function(from,to,base){
		if (!base) base=from;
		var fromdiff=from.getTime()-base.getTime();
		var todiff=to.getTime()-base.getTime();
		var fromvalue={
			day:Math.floor(fromdiff/(1000*60*60*24)),
			month:$.monthdiff(base,from)
		};
		var tovalue={
			day:Math.floor(todiff/(1000*60*60*24)),
			month:$.monthdiff(base,to)
		};
		var values={
			diffdays:Math.floor((to.getTime()-from.getTime())/(1000*60*60*24))+1,
			diffmonths:$.monthdiff(from,to)+1,
			from:fromvalue,
			to:tovalue
		};
		return values;
	},
	monthdiff:function(from,to){
		from=new Date(from.format('Y-m').dateformat()+'/01');
		to=new Date(to.format('Y-m').dateformat()+'/01');
		diff=0;
		while (from.format('Y-m')!=to.format('Y-m'))
		{
			if (from<to)
			{
				from=from.calc('1 month');
				diff++;
			}
			else
			{
				from=from.calc('-1 month');
				diff--;
			}
		}
		return diff;
	}
});
})(jQuery);
