I want to build the following backend with a process like this: 

1. when i bookmark a site/page in raindrop.io it should appear in my api for which the docs can be found in https://developer.raindrop.io/
 
2. with every new entry i want that record to be added to my db at postgresql://postgres:QWvgNTqzfNibSLhAIcBSCMKFMbSWqOdD@monorail.proxy.rlwy.net:37604/railway, additional fields on that record that cant be populated at this point need to be: 
- tags::json | 
- blog_approved::boolean | 
- reason_for_bookmark::text | 
- created_at::timestamp | 
- category::text

3. my app exposes an endpoint /bookmarks which allows me access with an api-key in the url params without a valid api key i cant access the page, the page contains a cardgrid with a card for every bookmark i made in the last 30 days (as a default filter) and when clicking on the card i get a new page in which i can change all the values on the record 

4. when a card/record is set to true for the blo approval then a blog writer agent will write a markdown blogpost according to a skill we need for it and will post that into an endpoint view /drafts where i can see all the blogpost that need approval or feedback for a rewrite or to put them into the /bookmark status first 

5. after approval the blogpost will show up in the blog on the homepage where you can visit the post from. Start developing this and when you need input or variables before proceeding, ping me.
