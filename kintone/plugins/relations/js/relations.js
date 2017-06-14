/*
*--------------------------------------------------------------------
* jQuery-Plugin "relations"
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
		loaded:0,
		apps:{},
		config:{},
		offset:{}
	};
	var events={
		show:[
			'app.record.create.show',
			'app.record.edit.show'
		]
	};
	var functions={
		/* related data acquisition */
		relations:function(options){
			var options=$.extend({
				basefield:'',
				baseapp:'',
				baseappfield:'',
				istable:false,
				fields:[]
			},options);
			setInterval(function(){
				$.each($('body').fields(options.basefield),function(){
					var counter=0;
					var target=$(this);
					var targetvalue=(target.val())?target.val():'';
					if ($.data(target[0],'value')==null) $.data(target[0],'value','');
					if ($.data(target[0],'value')==targetvalue) return;
					$.data(target[0],'value',targetvalue);
					if (options.istable) counter=target.closest('tbody').find('tr').index(target.closest('tr'));
					/* set fields value */
					$.each(options.fields,function(index){
						var fieldvalues=$.extend({
							relationfield:'',
							relationapp:'',
							relationappfield:'',
							basecode:'',
							relationcode:'',
							lookup:false,
							rewrite:true,
						},options.fields[index]);
						var exclude=false;
						var field=$('body').fields(fieldvalues.relationfield)[counter];
						if (!fieldvalues.rewrite)
						{
							if (field.val())
								if (field.val().toString().length!=0) exclude=true;
						}
						if (!exclude)
							if (targetvalue.length!=0)
							{
								var filterbase=$.grep(vars.apps[options.baseapp],function(item,index){return item[options.baseappfield].value==targetvalue;});
								if (filterbase.length!=0)
								{
									var filterrelation=$.grep(vars.apps[fieldvalues.relationapp],function(item,index){
										return item[fieldvalues.relationcode].value==filterbase[0][fieldvalues.basecode].value;
									});
									if (filterrelation.length!=0)
									{
										field.val(filterrelation[0][fieldvalues.relationappfield].value);
										if (fieldvalues.lookup) field.parent().parent().find('button').eq(0).trigger('click');
									}
								}
							}
					});
				});
			},500);
		},
		/* loading wait */
	    waitloaded:function(callback){
	        setTimeout(function(){
	            if (vars.loaded!=Object.keys(vars.apps).length) functions.waitloaded(callback);
	            else callback();
	        },1000);
    	}
	};
	/*---------------------------------------------------------------
	 kintone events
	---------------------------------------------------------------*/
	kintone.events.on(events.show,function(event){
		vars.config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!vars.config) return false;
		var params=[];
	    /* get configuration */
	    $.each(JSON.parse(vars.config['relations']),function(index,values){
	    	params[index]={
	    		basefield:values['basefield'],
	    		baseapp:values['baseapp'],
	    		baseappfield:values['baseappfield'],
	    		istable:(values['istable']=='1')?true:false,
				fields:[]
	    	};
       		vars.apps[values['baseapp']]=null;
	    	var fields=[];
        	$.each(values['relations'],function(index,values){
        		fields.push({
		        	relationfield:values['relationfield'],
		        	relationapp:values['relationapp'],
		        	relationappfield:values['relationappfield'],
		        	basecode:values['basecode'],
		        	relationcode:values['relationcode'],
        			lookup:(values['lookup']=='1')?true:false,
        			rewrite:(values['rewrite']=='1')?false:true
        		});
        		vars.apps[values['relationapp']]=null;
        	});
        	params[index].fields=fields;
	    });
	    /* setup relation datas */
	    $.each(vars.apps,function(key,values){vars.offset[key]=0;loaddatas(key);})
		/* loading wait */
		functions.waitloaded(function(){
			$.each(params,function(index){functions.relations(params[index]);});
		});
		return event;
	});
	var limit=500;
	/*---------------------------------------------------------------
	 all data load
	---------------------------------------------------------------*/
	function loaddatas(appkey){
        kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:appkey,query:'order by $id asc limit '+limit.toString()+' offset '+vars.offset[appkey].toString()},function(resp){
        	if (vars.apps[appkey]==null) vars.apps[appkey]=resp.records;
        	else Array.prototype.push.apply(vars.apps[appkey],resp.records);
			vars.offset[appkey]+=limit;
			if (resp.records.length==limit) loaddatas(appkey);
			else vars.loaded++;
		},function(error){});
	}
})(jQuery,kintone.$PLUGIN_ID);
