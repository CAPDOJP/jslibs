(function($){
jQuery.extend({
	/* calculate date values */
	hotelmanagementdatecalc:function(from,to,base){
		if (!base) base=from;
		var fromdiff=from.getTime()-base.getTime();
		var todiff=to.getTime()-base.getTime();
		var basetime={
			hour:base.getHours(),
			minute:base.getMinutes()
		};
		var fromtime={
			day:fromdiff/(1000*60*60*24),
			hour:basetime.hour+Math.floor((basetime.minute+fromdiff/(1000*60))/60),
			minute:(basetime.minute+fromdiff/(1000*60))%60
		};
		var totime={
			day:todiff/(1000*60*60*24),
			hour:basetime.hour+Math.floor((basetime.minute+todiff/(1000*60))/60),
			minute:(basetime.minute+todiff/(1000*60))%60
		};
		var values={
			diffhours:Math.ceil((to.getTime()-from.getTime())/(1000*60*60)),
			diffminutes:Math.ceil((to.getTime()-from.getTime())/(1000*60)),
			passedhours:Math.floor((to.getTime()-from.getTime())/(1000*60*60)),
			passedminutes:Math.floor(((to.getTime()-from.getTime())/(1000*60))%60),
			from:fromtime,
			to:totime,
			formatfrom:('0'+fromtime.hour).slice(-2)+':'+('0'+fromtime.minute).slice(-2),
			formatto:('0'+totime.hour).slice(-2)+':'+('0'+totime.minute).slice(-2)
		};
		return values;
	}
});
})(jQuery);
