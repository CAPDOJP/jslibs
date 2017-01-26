/*
*--------------------------------------------------------------------
* jQuery-Plugin "grideditor -config.js-"
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
	var VIEW_NAME='一括編集';
	/*---------------------------------------------------------------
	 initialize fields
	---------------------------------------------------------------*/
	kintone.api(kintone.api.url('/k/v1/form',true),'GET',{app:kintone.app.getId()},function(resp){
        var config=kintone.plugin.app.getConfig(PLUGIN_ID);
		$.each(resp.properties,function(index,values){
			/* check field type */
			switch (values.type)
			{
				case 'NUMBER':
					/* exclude lookup */
					if (!values.relatedApp)
					{
						/* check scale */
						if (values.displayScale)
							if (values.displayScale>8)
							{
								$('select#lat').append($('<option>').attr('value',values.code).text(values.label));
								$('select#lng').append($('<option>').attr('value',values.code).text(values.label));
							}
					}
					break;
				case 'SINGLE_LINE_TEXT':
					/* exclude lookup */
					if (!values.relatedApp) $('select#address').append($('<option>').attr('value',values.code).text(values.label));
					break;
			}
	        if (Object.keys(config).length!==0)
	        {
	        	$('select#address').val(config['address']);
	        	$('select#lat').val(config['lat']);
	        	$('select#lng').val(config['lng']);
	        }
		});
	},function(error){});
	/*---------------------------------------------------------------
	 button events
	---------------------------------------------------------------*/
	$('button#submit').on('click',function(e){
        var config=[];
	    /* check values */
	    if ($('select#address').val()!='')
	    {
		    if ($('select#lat').val()=='')
		    {
		    	swal('Error!','緯度表示フィールドを選択して下さい。','error');
		    	return;
		    }
		    if ($('select#lng').val()=='')
		    {
		    	swal('Error!','経度表示フィールドを選択して下さい。','error');
		    	return;
		    }
		    if ($('select#lat').val()==$('select#lng').val())
		    {
		    	swal('Error!','緯度表示フィールドと経度表示フィールドは異なるフィールドを選択して下さい。','error');
		    	return;
		    }
	    }
		var body={
			app:kintone.app.getId()
		};
	    /* get view lists */
		kintone.api(kintone.api.url('/k/v1/preview/app/views',true),'GET',body,function(resp){
			var req=$.extend(true,{},resp);
			req.app=kintone.app.getId();
			if (!req.views[VIEW_NAME])
			{
			    /* swaps the index */
				for (var key in req.views) req.views[key].index=Number(req.views[key].index)+1;
    		    /* create custom view */
				req.views[VIEW_NAME]={
					type:'CUSTOM',
					name:VIEW_NAME,
					html:'<div id="grideditor-container" class="customview-container"></div>',
					filterCond:'',
					sort:'',
					pager:true,
					index:0
				};
			}
			/* save viewid */
			kintone.api(kintone.api.url('/k/v1/preview/app/views',true),'PUT',req,function(resp){
				/* setup config */
		        config['address']=$('select#address').val();
		        config['lat']=$('select#lat').val();
		        config['lng']=$('select#lng').val();
		        config['lng']=$('select#lng').val();
		        config['grideditorview']=resp.views[VIEW_NAME].id;
				/* save config */
				kintone.plugin.app.setConfig(config);
			},function(error){});
		},function(error){});
	});
    $('button#cancel').on('click',function(e){
        history.back();
    });
})(jQuery,kintone.$PLUGIN_ID);