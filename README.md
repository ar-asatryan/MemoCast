# MemoCast


Memocast - Node.js application

 - Hi level overview
 - Main components details
 - Configuration details

## Settings



## Deployment

# Memocast Updates Workflow

1. Create a ticket which describes what exactly you are going to do

2. In the ticket, create a Merge Request. The MR creates a development brunch for you automatically

3. In your development `git` folder:

    ```sh
    $ git pull
    $ git checkout <the freshly created branch>
    ```

4. Do all the necessary changes

5. Commit changes when necessary, adding a ticket number prefix plus the change's description:

    ```sh
    $ git commit -am "[123] Completed development of new feature"
    ```

6. If commit triggers CI build verify that the commit compiled successfully. Fix all build problems

7. In the Merge Request, assign a code reviewer who will review and approve your changes

8. Work with the reviewer until all findings being resolved and the MR has been approved by the reviewer

9. When the development of the ticket is done, synchronize with the latest changes on `master` by rebasing your local git repo to the latest master:

    ```sh
    $ git pull
    $ git rebase -i origin/master
    <... possible conflict resolution actions ...>
    ```

10. Safely push your changes back to the branch:

    ```sh
    $ git push --force-with-lease
    ```

11. Merge your approved changes back to `master` with `delete branch` but without `squashing`
