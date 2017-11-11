/*
*--------------------------------------------------------------------
* jQuery-Plugin "lookupfilter"
* Version: 1.0
* Copyright (c) 2017 TIS
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
		segment:null,
		apps:{},
		config:{},
		containers:{},
		lookups:{}
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.edit.show'
		]
	};
	var limit=500;
	var functions={
		/* append buttons */
		appendsegments:function(fieldcode){
			$.each($('body').fields(fieldcode),function(index){
				var target=$(this).addClass('relatedto');
				var buttons={
					ok:target.closest('div[class*=lookup]').find('button.input-lookup-gaia').hide(),
					clear:target.closest('div[class*=lookup]').find('button.input-clear-gaia')
				};
				var container=target.closest('div').css({'width':'auto'});
				var segments=vars.lookups[fieldcode].segments;
				if ($.data(target[0],'added')==null) $.data(target[0],'added',false);
				if ($.data(target[0],'added')) return true;
				/* initialize valiable */
				vars.containers[fieldcode+'_'+index.toString()]=container;
				/* append dropdown */
				var list=null;
				for (var i=0;i<segments.length;i++)
				{
					list=vars.segment.clone(true);
					list.find('select')
					.attr('id',segments[i])
					.attr('data-index',i)
					.on('change',function(){
						var index=parseInt($(this).attr('data-index'));
						functions.reloadsegments(fieldcode,container,index);
					});
					container.append(list);
				}
				list=vars.segment.clone(true);
				list.find('select')
				.attr('id','relatedfrom')
				.on('change',function(){
					if ($(this).val().length!=0)
					{
						$('.relatedto',container).val($(this).val());
						buttons.ok.trigger('click');
					}
				});
				target.hide();
				container.append(list).parents('[class*=lookup]').css({'width':'auto'});
				functions.reloadsegments(fieldcode,container,-1);
				$.data(target[0],'added',true);
			});
		},
		/* reload datas */
		loaddatas:function(counter,params,callback){
			var body={
				app:params[counter].app,
				query:params[counter].condition+' order by $id asc limit '+params[counter].limit.toString()+' offset '+params[counter].offset.toString()
			};
			kintone.api(kintone.api.url('/k/v1/records',true),'GET',body,function(resp){
				Array.prototype.push.apply(params[counter].records,resp.records);
				params[counter].offset+=params[counter].limit;
				if (resp.records.length==params[counter].limit) functions.loaddatas(counter,params,callback);
				else
				{
					counter++;
					if (counter<params.length) functions.loaddatas(counter,params,callback);
					else callback();
				}
			},function(error){});
		},
		/* reload segment values */
		reloadsegments:function(fieldcode,container,trigger){
			var list=null;
			var listcover=null;
			var conditions={};
			var filter=[];
			var options=[];
			var records=vars.apps[vars.lookups[fieldcode].app];
			var segments=vars.lookups[fieldcode].segments;
			for (var i=0;i<segments.length;i++)
			{
				list=$('#'+segments[i],container);
				listcover=list.closest('.lookupfilter');
				if (i<trigger+1)
				{
					if (list.val().length!=0)
					{
						/* append conditions */
						conditions[segments[i]]=list.val();
						continue;
					}
					else
					{
						/* hide following lists */
						for (var i2=i+1;i2<segments.length;i2++) $('#'+segments[i2],container).closest('.lookupfilter').hide();
						break;
					}
				}
				if (i==trigger+1)
				{
					/* get datas */
					filter=$.grep(records,function(item,index){
						var exists=0;
						$.each(conditions,function(key,values){if (item[key].value==values) exists++;});
						return exists==Object.keys(conditions).length;
					});
					for (var i2=0;i2<filter.length;i2++)
					{
						var option=$.fieldvalue(filter[i2][segments[i]]);
						if ($.inArray(option,options)<0) options.push(option);
					}
					list.empty().append($('<option>').attr('value','').text(''));
					for (var i2=0;i2<options.length;i2++) list.append($('<option>').attr('value',options[i2]).html('&nbsp;'+options[i2]+'&nbsp;'));
					listcover.show();
					continue;
				}
				listcover.hide();
			}
			list=$('#relatedfrom',container).empty().append($('<option>').attr('value','').text(''));
			listcover=list.closest('.lookupfilter');
			if (Object.keys(conditions).length==segments.length)
			{
				filter=$.grep(records,function(item,index){
					var exists=0;
					$.each(conditions,function(key,values){if (item[key].value==values) exists++;});
					return exists==Object.keys(conditions).length;
				});
				for (var i=0;i<filter.length;i++)
				{
					list.append(
						$('<option>')
						.attr('value',$.fieldvalue(filter[i][vars.lookups[fieldcode].relatedkey]))
						.html('&nbsp;'+$.fieldvalue(filter[i][vars.lookups[fieldcode].display])+'&nbsp;')
					);
				}
				listcover.show();
			}
			else listcover.hide();
		},
		/* setup segment values */
		setupsegments:function(fieldcode,record,row){
			if (!record[fieldcode].value) return;
			if (record[fieldcode].value.length==0) return;
			var container=vars.containers[fieldcode+'_'+row.toString()];
			var records=$.grep(vars.apps[vars.lookups[fieldcode].app],function(item,index){return item[vars.lookups[fieldcode].relatedkey].value==record[fieldcode].value;});
			var segments=vars.lookups[fieldcode].segments;
			if (records.length!=0)
			{
				for (var i=0;i<segments.length;i++) $('#'+segments[i],container).val(records[0][segments[i]].value).trigger('change');
				$('#relatedfrom',container).val(records[0][vars.lookups[fieldcode].relatedkey].value);
			}
		}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		/* initialize valiable */
		vars.segment=$('<div class="kintoneplugin-select-outer lookupfilter">').append($('<div class="kintoneplugin-select">').append($('<select>')));
		vars.lookups=JSON.parse(vars.config['lookup']);
		var counter=0;
		var params=[];
		$.each(vars.lookups,function(key,values){
			if ($.grep(params,function(item,index){return item.app==values.app;}).length==0)
				params.push({
					app:values.app,
					condition:values.filtercond,
					limit:limit,
					offset:0,
					records:[]
				});
		});
		if (params.length==0) return event;
		functions.loaddatas(counter,params,function(){
			for (var i=0;i<params.length;i++) vars.apps[params[i].app]=params[i].records;
			$.each(vars.lookups,function(key,values){
				/* append segments */
				functions.appendsegments(key);
				if (values.tablecode.length!=0)
				{
					var events=[];
					events.push('app.record.create.change.'+values.tablecode);
					events.push('app.record.edit.change.'+values.tablecode);
					kintone.events.on(events,function(event){
						$.each(event.changes.row.value,function(key,values){
							if (key in vars.lookups) functions.appendsegments(key);
						});
						return event;
					});
				}
				/* setup segments */
				if (values.tablecode.length!=0)
				{
					for (var i=0;i<event.record[values.tablecode].value.length;i++)
					{
						var record=event.record[values.tablecode].value[i].value;
						functions.setupsegments(key,record,i);
					}
				}
				else functions.setupsegments(key,event.record,0);
			});
		});
	});
})(jQuery,kintone.$PLUGIN_ID);
