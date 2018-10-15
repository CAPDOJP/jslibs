(function($){
jQuery.extend({
	/* calculate date values */
	timetabledatecalc:function(from,to,starthour,base){
		if (starthour) from=new Date((from.format('Y-m-d')+'T'+('0'+starthour).slice(-2)+':00:00+0900').dateformat());
		if (!base) base=from;
		var fromdiff=from.getTime()-base.getTime();
		var todiff=to.getTime()-base.getTime();
		var basetime={
			hour:base.getHours(),
			minute:base.getMinutes()
		};
		var fromtime={
			hour:basetime.hour+Math.floor((basetime.minute+fromdiff/(1000*60))/60),
			minute:(basetime.minute+fromdiff/(1000*60))%60
		};
		var totime={
			hour:basetime.hour+Math.floor((basetime.minute+todiff/(1000*60))/60),
			minute:(basetime.minute+todiff/(1000*60))%60
		};
		var values={
			diffhours:Math.ceil((basetime.minute+todiff/(1000*60))/60),
			from:fromtime,
			to:totime,
			formatfrom:('0'+fromtime.hour).slice(-2)+':'+('0'+fromtime.minute).slice(-2),
			formatto:('0'+totime.hour).slice(-2)+':'+('0'+totime.minute).slice(-2)
		};
		return values;
	}
});
})(jQuery);
