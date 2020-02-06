const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose')
const _ = require('lodash')

const { getDate, getDay} = require("./date")

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");



mongoose.connect('mongodb+srv://shikhar0208:8447088311@cluster0-ozu5l.mongodb.net/todolistDB',{
    useNewUrlParser: true,   
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true
})

const itemsSchema = new mongoose.Schema({
    name: {
      type: String
    }
})

const Item = mongoose.model('Item', itemsSchema)

const defaultItems = []

const listSchema = {
  name: {
    type: String,
    unique: true,
  },
  items: [itemsSchema] 
}

const List = mongoose.model("List", listSchema)

app.get("/", (req, res) => {
  const day = getDate()  
  Item.find((err,foundItems)=>{
    res.render("list", { listTitle: day, newListItems: foundItems });
  })
  
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get('/:customListName', async (req, res) => {
  const customListName = _.capitalize(req.params.customListName)
  const list =  new List({
    name: customListName,
    items: defaultItems
  })

  await list.save().then(()=>{
    res.redirect("/" + customListName)
  }).catch((e) => {
    List.findOne({name: customListName}, (error, foundList) => {    
      try{
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
      } catch(e){
        res.status(500).send("Server Error")
      }
    })
  })

})

app.post("/", async (req, res) => {
  const day = getDate()
  const itemName = req.body.newItem;
  const listName = req.body.list
  
  const item = new Item({
    name: itemName
  })
  if(listName === day){
    await item.save()
      res.redirect('/')
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item)
      foundList.save(() => {
        res.redirect("/" + listName)
      })
    })
  }
});


app.post('/delete', (req, res)=>{
  const checkedItemId = req.body.checked
  const listName = req.body.listName
  if(listName === getDate()){
    Item.deleteOne({_id: checkedItemId}, (err) => {
      try{
        res.redirect('/')
      } catch (err) {
        res.status(500).send("Error!")
      }
    })
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundList) => {
      try{
        res.redirect('/' + listName)
      } catch (err) {
        res.status(500).send("Error!")
      }
    })
  }

  
})


app.listen(port, () => {
  console.log("Server is up on port " + port);
});
