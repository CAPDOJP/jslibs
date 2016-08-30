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
		apps:{}
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
					var targetvalue=(target.val()!=null)?target.val():'';
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
							if (field.val()!=null)
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
		var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		if (!config) return false;
		var params=[];
	    /* get configuration */
	    $.each(JSON.parse(config['relations']),function(index,values){
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
	    $.each(vars.apps,function(key,values){
	        kintone.api(kintone.api.url('/k/v1/records',true),'GET',{app:key},function(resp){
	        	vars.apps[key]=resp.records;
	        	vars.loaded++;
			},function(error){});
	    })
		/* loading wait */
		functions.waitloaded(function(){
			$.each(params,function(index){functions.relations(params[index]);});
		});
		return event;
	});
})(jQuery,kintone.$PLUGIN_ID);
