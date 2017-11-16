/*
*--------------------------------------------------------------------
* jQuery-Plugin "taxcalc"
* Version: 1.0
* Copyright (c) 2016 TIS
*
* Released under the MIT License.
* http://tis2010.jp/license.txt
* -------------------------------------------------------------------
*/
jQuery.noConflict();
(function($,PLUGIN_ID){
	"use strict";
	/*---------------------------------------------------------------
	 valiable
	---------------------------------------------------------------*/
	var vars={
		relations:[],
		events:[],
		config:{}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
	if ('relation' in vars.config)
	{
		vars.relations=JSON.parse(vars.config['relation']);
		for (var i=0;i<vars.relations.length;i++)
		{
			vars.events.push('app.record.create.change.'+vars.relations[i].price);
			vars.events.push('mobile.app.record.create.change.'+vars.relations[i].price);
			vars.events.push('app.record.edit.change.'+vars.relations[i].price);
			vars.events.push('mobile.app.record.edit.change.'+vars.relations[i].price);
			vars.events.push('app.record.index.edit.change.'+vars.relations[i].price);
		}
		if (vars.events)
			kintone.events.on(vars.events,function(event){
				if (!event.record[vars.config['taxdate']].value) return event;
				var type=event.type.split('.');
				/* calculate subtotal and tax */
				for (var i=0;i<vars.relations.length;i++)
					if (type[type.length-1]==vars.relations[i].price)
					{
						var able=0;
						var free=0;
						var price=0;
						var totax=false;
						var relation=vars.relations[i];
						for (var i2=0;i2<event.record[relation.tablecode].value.length;i2++)
						{
							var row=event.record[relation.tablecode].value[i2];
							price=(row.value[relation.price].value)?parseFloat('0'+row.value[relation.price].value.replace(/,/g,'')):0;
							totax=(row.value[relation.taxsegment].value)?(row.value[relation.taxsegment].value==relation.totax):false;
							if (totax) able+=price;
							else free+=price;
						}
						var taxround='';
						switch (vars.config['taxround'])
						{
							case '1':
								taxround='floor';
								break;
							case '2':
								taxround='ceil';
								break;
							case '3':
								taxround='round';
								break;
						}
						var calc=$.calculatetax({
							able:able,
							free:free,
							isoutsidetax:(vars.config['taxshift']=='0'),
							taxround:taxround,
							taxrate:$.calculatetaxrate(new Date(event.record[vars.config['taxdate']].value.dateformat()))
						});
						event.record[relation.subbill].value=(calc.able-calc.tax+calc.free).toString();
						event.record[relation.tax].value=calc.tax.toString();
					}
				return event;
			});
	}
})(jQuery,kintone.$PLUGIN_ID);
