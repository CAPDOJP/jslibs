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
	kintone.api(kintone.api.url('/k/v1/app/form/fields',true),'GET',{app:kintone.app.getId()},function(resp){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if ('relation' in vars.config)
		{
			vars.relations=JSON.parse(vars.config['relation']);
			/* setup event */
			var fieldinfos=$.fieldparallelize(resp.properties);
			if (!(vars.config['taxdate'] in fieldinfos)) return;
			vars.events.push('app.record.create.change.'+vars.config['taxdate']);
			vars.events.push('app.record.edit.change.'+vars.config['taxdate']);
			for (var i=0;i<vars.relations.length;i++)
			{
				if (!(vars.relations[i].unitprice in fieldinfos)) continue;
				if (!(vars.relations[i].taxsegment in fieldinfos)) continue;
				vars.events.push('app.record.create.change.'+vars.relations[i].unitprice);
				vars.events.push('app.record.edit.change.'+vars.relations[i].unitprice);
				vars.events.push('app.record.create.change.'+vars.relations[i].taxsegment);
				vars.events.push('app.record.edit.change.'+vars.relations[i].taxsegment);
				if (vars.relations[i].quantity.length!=0)
					if (vars.relations[i].quantity in fieldinfos)
					{
						vars.events.push('app.record.create.change.'+vars.relations[i].quantity);
						vars.events.push('app.record.edit.change.'+vars.relations[i].quantity);
					}
				if (fieldinfos[vars.relations[i].unitprice].tablecode.length!=0)
				{
					vars.events.push('app.record.create.change.'+fieldinfos[vars.relations[i].unitprice].tablecode);
					vars.events.push('app.record.edit.change.'+fieldinfos[vars.relations[i].unitprice].tablecode);
				}
			}
			kintone.events.on(vars.events,function(event){
				if (!event.record[vars.config['taxdate']].value) return event;
				/* calculate subtotal and tax */
				for (var i=0;i<vars.relations.length;i++)
				{
					var able=0;
					var free=0;
					var unitprice=0;
					var quantity=0;
					var totax=false;
					var relation=vars.relations[i];
					for (var i2=0;i2<event.record[relation.tablecode].value.length;i2++)
					{
						var row=event.record[relation.tablecode].value[i2];
						unitprice=0;
						quantity=1;
						totax=false;
						if (relation.unitprice.length!=0) unitprice=(row.value[relation.unitprice].value)?parseFloat('0'+row.value[relation.unitprice].value.replace(/,/g,'')):0;
						if (relation.quantity.length!=0) quantity=(row.value[relation.quantity].value)?parseFloat('0'+row.value[relation.quantity].value.replace(/,/g,'')):0;
						if (relation.totax.length!=0) totax=(row.value[relation.taxsegment].value)?(row.value[relation.taxsegment].value==relation.totax):false;
						if (totax) able+=unitprice*quantity;
						else free+=unitprice*quantity;
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
					event.record[relation.subtotal].value=(calc.able-calc.tax+calc.free).toString();
					event.record[relation.tax].value=calc.tax.toString();
				}
				return event;
			});
		}
	},function(error){});
})(jQuery,kintone.$PLUGIN_ID);
